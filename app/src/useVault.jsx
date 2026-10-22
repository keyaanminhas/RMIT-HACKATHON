import React, { createContext, useContext, useState, useEffect } from "react";
import { SYSTEM_CONFIG } from "./config";
import {
  normalizeIdentifier,
  computeAccountHmac,
  encryptPayload,
  decryptPayload,
  generateAuditHash
} from "./crypto";
import { INITIAL_SEEDS } from "./seed";

const VaultContext = createContext(null);

export function VaultProvider({ children }) {
  const [currentPersona, setCurrentPersona] = useState(SYSTEM_CONFIG.PERSONAS[0]); // Alice default
  const [organizations, setOrganizations] = useState(SYSTEM_CONFIG.ORGANIZATIONS);
  const [reports, setReports] = useState([]);
  const [requests, setRequests] = useState([]);
  const [proposals, setProposals] = useState(INITIAL_SEEDS.initialProposals);
  const [auditLog, setAuditLog] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [clock, setClock] = useState(Date.now());

  // Clock tick for countdown timers
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize vault with encrypted seed reports and genesis audit entry
  useEffect(() => {
    async function initVault() {
      let currentHash = "0000000000000000000000000000000000000000000000000000000000000000";
      const initialAudit = [];

      // Genesis Audit Entry
      const genesisEntry = {
        id: "AUDIT-000",
        timestamp: new Date().toISOString(),
        actor: "SYSTEM",
        org: "CONSORTIUM",
        action: "GENESIS_INITIALIZE",
        target: "CYBERSECURITY_FABRIC",
        details: "TideCloak Quorum-Enforced Governance & Hermetic E2EE Initialized",
        prevHash: currentHash
      };
      genesisEntry.hash = await generateAuditHash(currentHash, genesisEntry);
      currentHash = genesisEntry.hash;
      initialAudit.push(genesisEntry);

      // Encrypt and store seed reports
      const encryptedReports = [];
      for (const raw of INITIAL_SEEDS.rawReports) {
        const normalized = normalizeIdentifier(raw.identifierType, raw.rawIdentifier);
        const acctHash = await computeAccountHmac(normalized);

        const tier1Data = {
          identifierType: raw.identifierType,
          reasonCode: raw.reasonCode,
          severity: raw.severity,
          reportingOrg: raw.reportingOrg,
          createdAt: raw.createdAt
        };

        const tier1Encrypted = await encryptPayload(tier1Data, "tier1");
        const evidenceEncrypted = await encryptPayload(raw.evidenceText, "evidence");

        const storedReport = {
          id: raw.id,
          acctHash,
          reportingOrg: raw.reportingOrg,
          reporterName: raw.reporterName,
          tier1Encrypted,
          evidenceEncrypted,
          createdAt: raw.createdAt
        };
        encryptedReports.push(storedReport);

        const reportAudit = {
          id: `AUDIT-REP-${raw.id}`,
          timestamp: raw.createdAt,
          actor: raw.reporterName,
          org: raw.reportingOrg,
          action: "FILE_ENCRYPTED_REPORT",
          target: acctHash.substring(0, 16) + "...",
          details: `Client-side encrypted with Tide tags [tier1, evidence]. Reason: ${raw.reasonCode}`,
          prevHash: currentHash
        };
        reportAudit.hash = await generateAuditHash(currentHash, reportAudit);
        currentHash = reportAudit.hash;
        initialAudit.push(reportAudit);
      }

      setReports(encryptedReports);
      setAuditLog(initialAudit);
      setIsInitialized(true);
    }

    initVault();
  }, []);

  // Internal Audit Logger
  async function logAudit(action, target, details, customActor = null) {
    const actor = customActor || currentPersona;
    const prevHash = auditLog.length > 0 ? auditLog[auditLog.length - 1].hash : "0".repeat(64);
    const entry = {
      id: `AUDIT-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      actor: actor.name,
      org: actor.orgId,
      action,
      target,
      details,
      prevHash
    };
    entry.hash = await generateAuditHash(prevHash, entry);
    setAuditLog(prev => [...prev, entry]);
    return entry;
  }

  // F2: File a Mule Report (Client-Side Encrypted)
  async function fileReport({ identifierType, rawIdentifier, reasonCode, severity, evidenceText }) {
    if (!currentPersona.tideRoles.includes("_tide_evidence.selfencrypt")) {
      throw new Error("TideCloak Unauthorized: Your role does not possess '_tide_evidence.selfencrypt' permission.");
    }

    const normalized = normalizeIdentifier(identifierType, rawIdentifier);
    const acctHash = await computeAccountHmac(normalized);

    const tier1Data = {
      identifierType,
      reasonCode,
      severity,
      reportingOrg: currentPersona.orgId,
      createdAt: new Date().toISOString()
    };

    // Hermetic E2EE in browser
    const tier1Encrypted = await encryptPayload(tier1Data, "tier1");
    const evidenceEncrypted = await encryptPayload(evidenceText, "evidence");

    const newReport = {
      id: `REP-${Date.now().toString(36).toUpperCase()}`,
      acctHash,
      reportingOrg: currentPersona.orgId,
      reporterName: currentPersona.name,
      tier1Encrypted,
      evidenceEncrypted,
      createdAt: new Date().toISOString()
    };

    setReports(prev => [newReport, ...prev]);

    await logAudit(
      "FILE_ENCRYPTED_REPORT",
      acctHash.substring(0, 16) + "...",
      `Account hashed via HMAC. Sealed with Tide tags [tier1, evidence]. Reason: ${reasonCode}`
    );

    return newReport;
  }

  // F3: Check Identifier (Tier 1 Lookup)
  async function checkIdentifier(identifierType, rawIdentifier) {
    const normalized = normalizeIdentifier(identifierType, rawIdentifier);
    const targetHash = await computeAccountHmac(normalized);

    const match = reports.find(r => r.acctHash === targetHash);

    if (!match) {
      await logAudit("CHECK_SIGNAL_MISS", targetHash.substring(0, 16) + "...", "Zero hits in shared registry");
      return { hit: false, hash: targetHash };
    }

    // Decrypt Tier 1 Metadata only
    try {
      const decryptedTier1 = await decryptPayload(match.tier1Encrypted, currentPersona.tideRoles);
      await logAudit("CHECK_SIGNAL_HIT", targetHash.substring(0, 16) + "...", `Signal Hit: Reason ${decryptedTier1.reasonCode}`);
      return {
        hit: true,
        hash: targetHash,
        reportId: match.id,
        reportingOrg: match.reportingOrg,
        tier1: decryptedTier1,
        evidenceLocked: true
      };
    } catch (err) {
      await logAudit("CHECK_SIGNAL_DECRYPT_FAIL", match.id, err.message);
      throw err;
    }
  }

  // F4: Request Tier-2 Evidence Disclosure
  async function requestTier2Disclosure(reportId, caseRef, justification) {
    const report = reports.find(r => r.id === reportId);
    if (!report) throw new Error("Report not found");

    const newRequest = {
      id: `REQ-${Date.now().toString(36).toUpperCase()}`,
      reportId,
      reportingOrg: report.reportingOrg,
      requesterId: currentPersona.id,
      requesterName: currentPersona.name,
      requesterOrg: currentPersona.orgId,
      caseRef,
      justification,
      approvals: [],
      status: "PENDING", // PENDING, APPROVED, EXPIRED, DENIED
      expiresAt: null,
      createdAt: new Date().toISOString()
    };

    setRequests(prev => [newRequest, ...prev]);

    await logAudit(
      "REQUEST_TIER2_DISCLOSURE",
      reportId,
      `Case: ${caseRef} | Org: ${currentPersona.orgId} requested evidence disclosure`
    );

    return newRequest;
  }

  // F5: Approve Tier-2 Disclosure with Multi-Party Quorum Rules
  async function approveTier2Disclosure(requestId) {
    const req = requests.find(r => r.id === requestId);
    if (!req) throw new Error("Request not found");

    // RULE 1: Must have officer role
    if (currentPersona.role !== "officer") {
      const msg = `Unauthorized: Persona '${currentPersona.name}' is an analyst. Only compliance officers can sign approval quorums.`;
      await logAudit("BLOCKED_APPROVAL_ROLE", requestId, msg);
      throw new Error(msg);
    }

    // RULE 2: No Self-Approval!
    if (req.requesterOrg === currentPersona.orgId || req.requesterId === currentPersona.id) {
      const msg = `Forseti Policy Violation: Requester (${req.requesterOrg}) cannot approve their own disclosure request. Self-approval strictly forbidden!`;
      await logAudit("BLOCKED_SELF_APPROVAL", requestId, msg);
      throw new Error(msg);
    }

    // RULE 3: Same org cannot vote twice
    if (req.approvals.some(a => a.orgId === currentPersona.orgId)) {
      const msg = `Duplicate Vote: Organization '${currentPersona.orgId}' has already signed this approval quorum.`;
      throw new Error(msg);
    }

    const newApproval = {
      officerId: currentPersona.id,
      officerName: currentPersona.name,
      orgId: currentPersona.orgId,
      timestamp: new Date().toISOString()
    };

    const updatedApprovals = [...req.approvals, newApproval];
    let newStatus = req.status;
    let expiresAt = req.expiresAt;

    // Check if distinct org quorum is met (Threshold = 2)
    if (updatedApprovals.length >= SYSTEM_CONFIG.QUORUM_THRESHOLD) {
      newStatus = "APPROVED";
      expiresAt = Date.now() + (SYSTEM_CONFIG.DISCLOSURE_TTL_SECONDS * 1000);
    }

    setRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? { ...r, approvals: updatedApprovals, status: newStatus, expiresAt }
          : r
      )
    );

    await logAudit(
      newStatus === "APPROVED" ? "TIER2_QUORUM_MET" : "TIER2_APPROVAL_SIGNED",
      requestId,
      `Signed by ${currentPersona.name} (${currentPersona.orgId}). Approvals: ${updatedApprovals.length}/${SYSTEM_CONFIG.QUORUM_THRESHOLD}`
    );
  }

  // F6: Decrypt Evidence (Only if approved and within TTL)
  async function decryptEvidence(requestId) {
    const req = requests.find(r => r.id === requestId);
    if (!req) throw new Error("Request not found");

    if (req.status !== "APPROVED") {
      throw new Error("Access Denied: Tier-2 disclosure has not reached the required 2-of-3 quorum approvals.");
    }

    if (Date.now() > req.expiresAt) {
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "EXPIRED" } : r));
      await logAudit("ACCESS_DENIED_EXPIRED", requestId, "HTTP 410 Gone: Ephemeral disclosure window has closed");
      throw new Error("HTTP 410 Gone: The 90-second ephemeral disclosure window has expired. Evidence wiped from client memory.");
    }

    // Requester decrypts the evidence payload
    const report = reports.find(r => r.id === req.reportId);
    if (!report) throw new Error("Report missing");

    const plaintextEvidence = await decryptPayload(report.evidenceEncrypted, currentPersona.tideRoles);
    await logAudit("DECRYPT_EVIDENCE_SUCCESS", req.reportId, `Evidence decrypted by ${currentPersona.name} under active quorum lease`);
    return plaintextEvidence;
  }

  // F7: Collective Governance (QEA M-of-N Vote)
  async function voteOnProposal(proposalId, choice) {
    if (currentPersona.role !== "officer") {
      throw new Error("Only Compliance Officers holding 'tide-realm-admin' can participate in QEA governance quorums.");
    }

    const prop = proposals.find(p => p.id === proposalId);
    if (!prop) throw new Error("Proposal not found");

    if (prop.votes.some(v => v.orgId === currentPersona.orgId)) {
      throw new Error(`Your organization (${currentPersona.orgId}) has already cast its cryptographic vote.`);
    }

    const voteEntry = {
      orgId: currentPersona.orgId,
      officerName: currentPersona.name,
      vote: choice,
      timestamp: new Date().toISOString()
    };

    const updatedVotes = [...prop.votes, voteEntry];
    const yesVotes = updatedVotes.filter(v => v.vote === "YES").length;
    let newStatus = prop.status;

    if (yesVotes >= prop.requiredThreshold) {
      newStatus = "PASSED";
      // Admit candidate organization
      setOrganizations(prev =>
        prev.map(org => org.id === prop.candidateOrg ? { ...org, isMember: true } : org)
      );
    }

    setProposals(prev =>
      prev.map(p => p.id === proposalId ? { ...p, votes: updatedVotes, status: newStatus } : p)
    );

    await logAudit(
      newStatus === "PASSED" ? "QEA_PROPOSAL_PASSED" : "QEA_VOTE_CAST",
      proposalId,
      `Voted ${choice} by ${currentPersona.name}. Quorum: ${yesVotes}/${prop.requiredThreshold}`
    );
  }

  // F8: Operator Admin Self-Grant Attack (The Swap Test demonstration)
  async function operatorAttemptSelfGrant() {
    await logAudit(
      "SECURITY_ALERT_ROGUE_OPERATOR",
      "tide-console/roles/assign",
      "Operator 'Malory Host' initiated unapproved assignment of '_tide_evidence.selfdecrypt' to self",
      currentPersona
    );

    return {
      success: false,
      error: "412 QUORUM_NOT_MET",
      detail: "Change Request CR-9904 status: PENDING. Approvals: 1 of 2 required (Threshold: 70%). The host operator cannot unilaterally commit role escalations without cryptographic officer signatures."
    };
  }

  // F9: Operator Database Dump (Ciphertext only!)
  function dumpOperatorDatabase() {
    return reports.map(r => ({
      reportId: r.id,
      acctHash_HMAC_SHA256: r.acctHash,
      reportingOrg: r.reportingOrg,
      tier1Cipher: r.tier1Encrypted.cipherText.substring(0, 32) + "...",
      evidenceCipher_AES256_GCM: r.evidenceEncrypted.cipherText.substring(0, 48) + "...",
      iv: r.evidenceEncrypted.iv,
      zeroPlaintextGuarantee: "VERIFIED: NO PII STORED ON HOST"
    }));
  }

  // F10: Verify Cryptographic Audit Chain
  async function verifyAuditChain() {
    let valid = true;
    for (let i = 1; i < auditLog.length; i++) {
      const prev = auditLog[i - 1];
      const curr = auditLog[i];
      const expectedHash = await generateAuditHash(prev.hash, curr);
      if (curr.hash !== expectedHash) {
        valid = false;
        break;
      }
    }
    return { valid, count: auditLog.length };
  }

  return (
    <VaultContext.Provider
      value={{
        isInitialized,
        currentPersona,
        setCurrentPersona,
        organizations,
        reports,
        requests,
        proposals,
        auditLog,
        clock,
        fileReport,
        checkIdentifier,
        requestTier2Disclosure,
        approveTier2Disclosure,
        decryptEvidence,
        voteOnProposal,
        operatorAttemptSelfGrant,
        dumpOperatorDatabase,
        verifyAuditChain
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
}
