import type {Capabilities} from './types';
import {loadTideConfig} from './config';
// No flag can turn incomplete cryptographic integration into an available feature.
// Shared encryption and signed quorum integration require a verified policy adapter.
export function capabilities():Capabilities {
 let authentication=false;try {loadTideConfig();authentication=true;}catch{}
 return {authentication,sharedEncryption:false,disclosurePolicy:false,governancePolicy:false,reasons:[...(!authentication?['TideCloak adapter is unavailable.']:[]),'Shared encryption requires a deployed signed Tide policy; identity self-encryption is not consortium sharing.','Disclosure release requires verified Tide enforcement of requester, distinct organisations, reporter approval and 30-minute expiry.','Governance changes require a committed Tide quorum; database votes alone cannot grant membership.']};
}
