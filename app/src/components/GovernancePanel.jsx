import React, { useState } from "react";
import { useVault } from "../useVault";
import { SYSTEM_CONFIG } from "../config";
import {
  Vote,
  CheckCircle2,
  AlertOctagon,
  Building2,
  Users,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  Sparkles
} from "lucide-react";

export function GovernancePanel() {
  const {
    organizations,
    proposals,
    voteOnProposal,
    currentPersona
  } = useVault();

  const [voteError, setVoteError] = useState(null);
  const [voteSuccess, setVoteSuccess] = useState(null);

  const isOfficer = currentPersona.role === "officer";

  async function handleVote(proposalId, choice) {
    setVoteError(null);
    setVoteSuccess(null);
    try {
      await voteOnProposal(proposalId, choice);
      setVoteSuccess(`Cryptographic ${choice} vote registered for ${currentPersona.orgId.toUpperCase()}!`);
    } catch (err) {
      setVoteError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Quorum-Enforced Authorization (QEA)
              </span>
              <span className="text-xs text-slate-400">Decentralized Consortium Governance</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Member-Governed Rule & Access Policy
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              No cloud administrator or platform vendor can unilaterally admit new members or alter access permissions. Changes require a <strong>cryptographic majority quorum</strong> among consortium officers.
            </p>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-purple-400 flex items-center gap-1.5">
              <Vote className="w-4 h-4" /> Tide QEA Protocol
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Consortium Quorum: 70% Supermajority (2 of 3)
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {voteError && (
        <div className="bg-red-950/40 border border-red-800 rounded-2xl p-4 text-xs text-red-300 flex items-center gap-3">
          <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
          <span>{voteError}</span>
        </div>
      )}

      {voteSuccess && (
        <div className="bg-emerald-950/40 border border-emerald-800 rounded-2xl p-4 text-xs text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{voteSuccess}</span>
        </div>
      )}

      {/* Member Organizations Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>Consortium Member Organizations</span>
          </h3>
          <span className="text-xs text-slate-400">
            {organizations.filter(o => o.isMember).length} Active Members
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {organizations.map(org => (
            <div
              key={org.id}
              className={`p-4 rounded-xl border transition-all ${
                org.isMember
                  ? "bg-slate-950/80 border-slate-800"
                  : "bg-slate-950/30 border-dashed border-slate-800/60 opacity-60"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-white">{org.name}</span>
                <span
                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    org.isMember
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  }`}
                >
                  {org.isMember ? "Active Member" : "Candidate"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Type: {org.type.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Proposals */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Vote className="w-4 h-4 text-purple-400" />
          <span>Active Quorum Governance Proposals</span>
        </h3>

        {proposals.map(prop => {
          const yesVotes = prop.votes.filter(v => v.vote === "YES").length;
          const hasVoted = prop.votes.some(v => v.orgId === currentPersona.orgId);
          const isPassed = prop.status === "PASSED";

          return (
            <div
              key={prop.id}
              className={`bg-slate-900 border rounded-2xl p-6 shadow-xl space-y-5 transition-all ${
                isPassed ? "border-emerald-500/50" : "border-slate-800"
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-400">
                      {prop.id}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs font-semibold text-slate-300">
                      Proposed by: {prop.proposerOrg.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">
                    {prop.title}
                  </h4>
                </div>

                <div>
                  {isPassed ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Passed & Committed at Quorum ({yesVotes}/{prop.requiredThreshold})
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                      <Vote className="w-3.5 h-3.5" />
                      Awaiting Signatures ({yesVotes}/{prop.requiredThreshold})
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {prop.description}
              </p>

              {/* Tally Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>Quorum Progress</span>
                  <span className="font-mono text-cyan-400">
                    {yesVotes} of {prop.requiredThreshold} Required Cryptographic Approvals
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isPassed ? "bg-emerald-500" : "bg-gradient-to-r from-purple-500 to-cyan-500"
                    }`}
                    style={{ width: `${Math.min(100, (yesVotes / prop.requiredThreshold) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Votes Log */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Attested Signatures Recorded in Quorum
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {prop.votes.map((v, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-slate-800 text-[11px]"
                    >
                      <span className="text-slate-300 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {v.officerName} ({v.orgId.toUpperCase()})
                      </span>
                      <span className="text-emerald-400 font-mono font-bold">
                        VOTED {v.vote}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {!isPassed && (
                <div className="pt-2 flex flex-wrap justify-between items-center gap-3 border-t border-slate-800">
                  <div className="text-xs text-slate-400">
                    {hasVoted ? (
                      <span className="text-emerald-400 font-medium">
                        ✓ Your organization has signed this proposal.
                      </span>
                    ) : isOfficer ? (
                      <span className="text-purple-300 font-medium">
                        You can cast a QEA quorum vote as officer for {currentPersona.orgId.toUpperCase()}.
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        Only officers can vote. (Switch to Olivia or Tom to cast a vote).
                      </span>
                    )}
                  </div>

                  {!hasVoted && isOfficer && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVote(prop.id, "YES")}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Sign YES</span>
                      </button>
                      <button
                        onClick={() => handleVote(prop.id, "NO")}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>Sign NO</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
