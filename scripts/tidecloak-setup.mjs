import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

// Windows-compatible adaptation of Tide Agent Pack's bootstrap sequence.
// Never deletes realms/data, fabricates an adapter, or supplies signing keys.
// Commands emit results; save an --export result to the ignored adapter path.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(readFileSync(resolve(root, '.env'), 'utf8')
  .split(/\r?\n/).filter(line => line.trim() && !line.trim().startsWith('#'))
  .map(line => { const at = line.indexOf('='); return [line.slice(0, at), line.slice(at + 1)]; }));
const base = process.env.TIDECLOAK_URL || 'http://localhost:8080';
const realm = env.TIDE_REALM_NAME || 'rmithackathon';
const clientId = env.TIDE_CLIENT_ID || 'rmithackathon-client';
const username = env.TIDE_OWNER_USERNAME || 'admin';
const origin = env.NEUTRALVAULT_APP_URL || 'http://localhost:3000';
let cachedToken;
let tokenUntil = 0;

async function token() {
  if (cachedToken && Date.now() < tokenUntil) return cachedToken;
  if (!env.KC_BOOTSTRAP_ADMIN_PASSWORD) throw new Error('Set KC_BOOTSTRAP_ADMIN_PASSWORD in .env.');
  const response = await fetch(`${base}/realms/master/protocol/openid-connect/token`, {
    method: 'POST', signal: AbortSignal.timeout(15000),
    body: new URLSearchParams({ client_id: 'admin-cli', grant_type: 'password',
      username: env.KC_BOOTSTRAP_ADMIN_USERNAME || 'admin', password: env.KC_BOOTSTRAP_ADMIN_PASSWORD }),
  });
  if (!response.ok) throw new Error(`Master admin authentication failed: HTTP ${response.status}.`);
  const data = await response.json();
  if (!data.access_token) throw new Error('Master admin token missing.');
  cachedToken = data.access_token;
  tokenUntil = Date.now() + Math.max(1, (data.expires_in || 60) - 15) * 1000;
  return cachedToken;
}

async function api(path, { method = 'GET', body, form, allow = [], timeout = 90000 } = {}) {
  const headers = { Authorization: `Bearer ${await token()}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (form) headers['Content-Type'] = 'application/x-www-form-urlencoded';
  const response = await fetch(`${base}${path}`, { method, headers, redirect: 'manual',
    body: form ? new URLSearchParams(form) : body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeout) });
  const raw = await response.text();
  let data; try { data = JSON.parse(raw); } catch { data = raw; }
  if (!response.ok && !allow.includes(response.status)) {
    const reason = typeof data === 'object' && data ? data.errorMessage || data.error || '' : '';
    throw new Error(`${method} ${path}: HTTP ${response.status}${reason ? ` (${String(reason).slice(0, 250)})` : ''}`);
  }
  return { status: response.status, data, location: response.headers.get('location') };
}
const realmPath = `/admin/realms/${realm}`;
const realmApi = (path = '', options) => api(`${realmPath}${path}`, options);
const say = message => console.log(message);
const pending = async () => {
  const { data } = await realmApi('/iga/change-requests?status=PENDING');
  if (!Array.isArray(data)) throw new Error('Unexpected change-request list response.');
  return data;
};

async function drainBootstrap() {
  let remaining = [];
  for (let pass = 0; pass < 6; pass++) {
    remaining = await pending();
    if (!remaining.length) return;
    const dangerous = remaining.filter(cr => /DISABLE_IGA|DELETE_|OFFBOARD|REVOKE/.test(cr.actionType));
    if (dangerous.length) throw new Error('Unexpected destructive/governance-reducing change request; bootstrap stopped.');
    let progressed = false;
    for (const cr of remaining) {
      const result = await realmApi(`/iga/change-requests/${encodeURIComponent(cr.id)}/authorize`, {
        method: 'POST', body: {}, allow: [403, 409, 412] });
      if (result.status >= 400) continue;
      progressed = true;
    }
    remaining = await pending();
    let signingErrors = 0;
    let committed = 0;
    for (const cr of remaining.filter(item => item.readyToCommit === true)) {
      const result = await realmApi(`/iga/change-requests/${encodeURIComponent(cr.id)}/commit`, {
        method: 'POST', allow: [403, 409, 412, 500] });
      if (result.status < 400) {
        progressed = true;
        committed++;
        if (committed === 1 || committed % 25 === 0) say(`Baseline commits in this pass: ${committed}.`);
      }
      if (result.status === 500 && ++signingErrors >= 3) {
        throw new Error('Three baseline signing attempts failed at the Tide network; QEA remains enabled and the existing queue is preserved.');
      }
    }
    if (!progressed) break;
  }
  remaining = await pending();
  if (remaining.length) throw new Error(`${remaining.length} bootstrap change requests remain pending; inspect tide-console before continuing.`);
}

async function recoverBaseline() {
  // Only recover the wizard-created baseline before any member accounts exist.
  // This is not an application approval or a way to bypass an established quorum.
  const users = await realmApi('/users?max=1');
  if (users.data.length) throw new Error('Baseline recovery requires an initial realm with no users; inspect the console.');
  const requests = await pending();
  if (requests.some(cr => !cr.actionType.startsWith('ADOPT_'))) {
    throw new Error('Non-baseline change requests are pending; refusing a broad approval sweep.');
  }
  say(`Recovering ${requests.length} initial ADOPT requests in ${realm}; QEA stays enabled.`);
  let count = 0;
  for (const cr of requests) {
    const result = await realmApi(`/iga/change-requests/${encodeURIComponent(cr.id)}/authorize`, {
      method: 'POST', body: {}, allow: [409], timeout: 75000 });
    if (result.status === 409 && !/already/i.test(JSON.stringify(result.data))) {
      throw new Error(`Baseline authorization conflict for ${cr.actionType}.`);
    }
    count++;
    if (count === 1 || count % 50 === 0) say(`Baseline authorizations recorded: ${count}/${requests.length}.`);
  }
  await drainBootstrap();
  say('Initial baseline approved and committed; wizard recovery may continue.');
}

async function prepareApplication() {
  const owner = await findOwner();
  if (await ownerIsAdmin(owner)) throw new Error('Application configuration now requires the enrolled admin browser approval ceremony.');
  await drainBootstrap();
  const { data: current } = await realmApi();
  await realmApi('', { method: 'PUT', body: { ...current,
    displayName: env.TIDE_PROJECT_NAME || 'RMITHACKATHON', registrationAllowed: false } });
  await drainBootstrap();
  const roles = await realmApi('/roles');
  for (const name of ['vault-analyst', 'vault-approver', 'vault-admin', '_tide_enabled', '_tide_encryptor', '_tide_decryptor']) {
    if (roles.data.some(role => role.name === name)) continue;
    await realmApi('/roles', { method: 'POST', body: { name,
      description: `NeutralVault capability ${name}; no automatic member assignment.` } });
  }
  await drainBootstrap();
  const groups = await realmApi('/groups?max=100');
  for (const name of ['bank-a', 'bank-b', 'telco-c', 'ewallet-d']) {
    if (groups.data.some(group => group.name === name)) continue;
    await realmApi('/groups', { method: 'POST', body: { name, attributes: {
      organisationId: [name], membership: [name === 'ewallet-d' ? 'pending' : 'active'] } } });
  }
  await drainBootstrap();
  const clients = await realmApi(`/clients?clientId=${clientId}`);
  const client = clients.data?.[0];
  if (!client) throw new Error('Application client is missing.');
  await realmApi(`/clients/${client.id}`, { method: 'PUT', body: { ...client,
    rootUrl: origin, baseUrl: '/', webOrigins: [origin],
    redirectUris: [`${origin}/*`],
    attributes: { ...client.attributes, 'dpop.bound.access.tokens': 'true',
      'post.logout.redirect.uris': `${origin}/*`, 'pkce.code.challenge.method': 'S256' } } });
  await drainBootstrap();
  const mappers = await realmApi(`/clients/${client.id}/protocol-mappers/models`);
  if (!mappers.data.some(mapper => mapper.config?.['claim.name'] === 'groups')) {
    await realmApi(`/clients/${client.id}/protocol-mappers/models`, { method: 'POST', body: {
      name: 'groups', protocol: 'openid-connect', protocolMapper: 'oidc-group-membership-mapper',
      consentRequired: false, config: { 'claim.name': 'groups', 'full.path': 'true',
        'access.token.claim': 'true', 'id.token.claim': 'false', 'userinfo.token.claim': 'false',
        'introspection.token.claim': 'true', 'lightweight.claim': 'true' } } });
    await drainBootstrap();
  }
  say('Application origin, DPoP, member capability roles and full-path organisation groups configured.');
  say('No member roles or organisation memberships were granted automatically.');
}

async function findOwner() {
  const { data } = await realmApi(`/users?username=${username}&exact=true`);
  return Array.isArray(data) ? data.find(user => user.username === username) : undefined;
}

async function realmManagement() {
  const { data } = await realmApi('/clients?clientId=realm-management');
  if (!data?.[0]?.id) throw new Error('realm-management client missing.');
  return data[0];
}

async function ownerIsAdmin(owner) {
  if (!owner) return false;
  const manager = await realmManagement();
  const { data } = await realmApi(`/users/${owner.id}/role-mappings/clients/${manager.id}`);
  return data.some(role => role.name === 'tide-realm-admin');
}

async function bootstrap() {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.TIDE_LICENSE_EMAIL || '') || env.TIDE_TERMS_ACCEPTED !== 'yes') {
    throw new Error('Licence owner email and explicit Tide terms acceptance are required in .env.');
  }
  let result = await realmApi('', { allow: [404] });
  if (result.status === 404) {
    const raw = readFileSync(resolve(root, 'scripts/tidecloak/realm.json.template'), 'utf8')
      .replaceAll('REALM_NAME', realm).replaceAll('CLIENT_NAME', clientId).replaceAll('CLIENT_APP_URL', origin);
    const template = JSON.parse(raw);
    template.roles.realm.push(...['vault-analyst', 'vault-approver', 'vault-admin']
      .map(name => ({ name, description: `NeutralVault ${name.replace('vault-', '')}; assigned only to admitted members.` })));
    template.groups = [
      { name: 'bank-a', attributes: { organisationId: ['bank-a'], membership: ['active'] } },
      { name: 'bank-b', attributes: { organisationId: ['bank-b'], membership: ['active'] } },
      { name: 'telco-c', attributes: { organisationId: ['telco-c'], membership: ['active'] } },
      { name: 'ewallet-d', attributes: { organisationId: ['ewallet-d'], membership: ['pending'] } },
    ];
    template.clients[0].defaultClientScopes = ['web-origins', 'acr', 'profile', 'roles', 'email'];
    template.eventsEnabled = true;
    template.adminEventsEnabled = true;
    template.adminEventsDetailsEnabled = false;
    await api('/admin/realms', { method: 'POST', body: template });
    say(`Created realm ${realm} and client ${clientId}; public registration disabled.`);
  } else {
    say(`Reusing existing realm ${realm}; no data will be removed.`);
    const owner = await findOwner();
    if (await ownerIsAdmin(owner)) {
      say('Owner already has Tide admin authority. Use --status; no bootstrap changes applied.');
      return;
    }
  }

  // Disable the stock first-login form only before enabling governed changes.
  const beforeProfile = await realmApi();
  result = await realmApi('/authentication/flows/first%20broker%20login/executions');
  const review = result.data.find(item => item.providerId === 'idp-review-profile');
  if (review && String(beforeProfile.data.attributes?.isIGAEnabled).toLowerCase() !== 'true') {
    const body = { alias: 'review profile config', config: { 'update.profile.on.first.login': 'off' } };
    await realmApi(review.authenticationConfig ? `/authentication/config/${review.authenticationConfig}`
      : `/authentication/executions/${review.id}/config`, { method: review.authenticationConfig ? 'PUT' : 'POST', body });
  }

  // Provisioning is resumable: a failed licence request may already have created
  // the IdP. Its existence alone does not prove that the Tide vendor is ready.
  const currentRealm = await realmApi();
  const providers = await realmApi('/identity-provider/instances');
  if (String(currentRealm.data.attributes?.isIGAEnabled).toLowerCase() !== 'true'
      && !providers.data.some(provider => provider.alias === 'tide')) {
    say('Activating Tide licence and provisioning the vendor key (live Tide network).');
    result = await realmApi('/vendorResources/setUpTideRealm', {
      method: 'POST', form: { email: env.TIDE_LICENSE_EMAIL, isRagnarokEnabled: 'true' }, timeout: 180000 });
    if (String(result.data).includes('NEED_PAYMENT')) throw new Error('Tide requires payment; no purchase was made.');
    say('Tide realm provisioning request completed.');
  } else if (String(currentRealm.data.attributes?.isIGAEnabled).toLowerCase() !== 'true') {
    // setUpTideRealm creates the IdP before finalizing the licence. Repeating it
    // after a partial failure produces a duplicate-IdP error on current builds.
    // Resume using Tide's documented vendor-key lifecycle endpoint instead.
    say('Resuming existing free-tier vendor-key provisioning.');
    result = await realmApi('/vendorResources/CreateTideVendorKey', {
      method: 'POST', form: { licensingTier: 'free' }, timeout: 180000 });
    if (String(result.data).includes('NEED_PAYMENT')) throw new Error('Tide requires payment; no purchase was made.');
    say('Vendor-key lifecycle request completed.');
  }
  result = await realmApi();
  if (String(result.data.attributes?.isIGAEnabled).toLowerCase() !== 'true') {
    await realmApi('', { method: 'PUT', body: { ...result.data,
      attributes: { ...result.data.attributes, 'iga.attestor': 'tide' } } });
    result = await realmApi('/tide-admin/toggle-iga', { method: 'POST', form: { isIGAEnabled: 'true' }, timeout: 180000 });
    if (result.data?.enabled !== true) throw new Error('IGA did not confirm enabled=true.');
    say('Cryptographic IGA enabled.');
  }
  await drainBootstrap();
  let owner = await findOwner();
  if (!owner) {
    await realmApi('/users', { method: 'POST', body: { username, email: env.TIDE_LICENSE_EMAIL,
      enabled: true, emailVerified: false, attributes: { tideInvitable: ['true'] } } });
    await drainBootstrap();
    owner = await findOwner();
  }
  if (!owner?.id) throw new Error('Owner account not found after creation.');
  if (owner.attributes?.tideUserKey?.[0]) {
    say('Owner already linked. Run --finish to complete bootstrap.');
    return;
  }
  const invite = await realmApi(`/tideAdminResources/get-required-action-link?userId=${owner.id}&lifespan=43200`, {
    method: 'POST', body: ['link-tide-account-action'] });
  say('ACTION_REQUIRED: Link your own Tide account using this private invite:');
  say(typeof invite.data === 'string' ? invite.data : JSON.stringify(invite.data));
  say('After linking, run: node scripts/tidecloak-setup.mjs --finish');
}

async function finish() {
  const owner = await findOwner();
  if (!owner?.attributes?.tideUserKey?.[0]) throw new Error('Owner has not completed Tide account linking.');
  if (await ownerIsAdmin(owner)) {
    say('Owner is already a Tide admin; no governed changes applied.');
    return;
  }
  await drainBootstrap();
  const provider = await realmApi('/identity-provider/instances/tide');
  await realmApi('/identity-provider/instances/tide', { method: 'PUT', body: { ...provider.data,
    config: { ...provider.data.config, CustomAdminUIDomain: `${base}/realms/${realm}/tide-console/` } } });
  await drainBootstrap();
  await realmApi('/vendorResources/sign-idp-settings', { method: 'POST', timeout: 180000 });
  const manager = await realmManagement();
  const { data: role } = await realmApi(`/clients/${manager.id}/roles/tide-realm-admin`);
  if (role.name !== 'tide-realm-admin') throw new Error('Tide admin role missing.');
  await realmApi(`/users/${owner.id}/role-mappings/clients/${manager.id}`, { method: 'POST', body: [role] });
  await drainBootstrap();
  if (!await ownerIsAdmin(await findOwner())) throw new Error('Tide admin grant did not commit.');
  say('Owner linked; Tide admin grant committed. Further governed changes require browser approvals.');
  say('One linked administrator is not yet the multi-organisation production quorum.');
}

async function status() {
  const result = await realmApi('', { allow: [404] });
  if (result.status === 404) { say('Realm has not been provisioned.'); return; }
  const owner = await findOwner();
  const providers = await realmApi('/identity-provider/instances');
  const roles = await realmApi('/roles');
  const clients = await realmApi(`/clients?clientId=${clientId}`);
  say(JSON.stringify({ base, realm, clientId, origin, enabled: result.data.enabled,
    igaEnabled: result.data.attributes?.isIGAEnabled, attestor: result.data.attributes?.['iga.attestor'],
    tideProvider: providers.data.some(item => item.alias === 'tide'),
    ownerExists: Boolean(owner), ownerLinked: Boolean(owner?.attributes?.tideUserKey?.[0]),
    ownerTideAdmin: await ownerIsAdmin(owner),
    applicationRoles: roles.data.filter(role => role.name.startsWith('vault-')).map(role => role.name),
    dpopBoundClient: clients.data[0]?.attributes?.['dpop.bound.access.tokens'],
    pendingChangeRequests: (await pending()).length }, null, 2));
}

async function exportAdapter() {
  const { data: clients } = await realmApi(`/clients?clientId=${clientId}`);
  if (!clients?.[0]?.id) throw new Error('NeutralVault client missing.');
  const result = await realmApi(`/vendorResources/get-installations-provider?clientId=${clients[0].id}&providerId=keycloak-oidc-keycloak-json`);
  const config = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
  for (const key of ['jwk', 'vendorId', 'homeOrkUrl']) {
    if (!config[key]) throw new Error(`Generated adapter lacks ${key}; do not replace it with a handwritten adapter.`);
  }
  if (config.realm !== realm || config.resource !== clientId) throw new Error('Adapter does not match the realm/client.');
  say(JSON.stringify(config, null, 2));
}

try {
  const command = process.argv[2] || '--status';
  if (command === '--bootstrap') await bootstrap();
  else if (command === '--finish') await finish();
  else if (command === '--export') await exportAdapter();
  else if (command === '--status') await status();
  else if (command === '--recover-baseline') await recoverBaseline();
  else if (command === '--prepare-app') await prepareApplication();
  else throw new Error('Usage: node scripts/tidecloak-setup.mjs --bootstrap|--finish|--status|--export|--recover-baseline|--prepare-app');
} catch (error) {
  console.error(`TideCloak setup stopped: ${error.message}`);
  process.exitCode = 1;
}
