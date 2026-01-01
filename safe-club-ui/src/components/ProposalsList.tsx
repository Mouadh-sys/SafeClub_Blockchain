"use client"

import type { Proposal } from "@/src/lib/types"
import { ProposalCard } from "./ProposalCard"
import { FileText } from "lucide-react"

interface ProposalsListProps {
  proposals: Proposal[]
  isMember: boolean
  voterAddress: string | null
  quorumBps: number | null
  checkHasVoted: (proposalId: number, voter: string) => Promise<boolean>
  onVote: (proposalId: number, support: boolean) => Promise<string>
  onExecute: (proposalId: number) => Promise<string>
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function ProposalsList({
  proposals,
  isMember,
  voterAddress,
  quorumBps,
  checkHasVoted,
  onVote,
  onExecute,
  onSuccess,
  onError,
}: ProposalsListProps) {
  if (proposals.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No proposals yet</p>
        {isMember && <p className="text-sm text-muted-foreground mt-1">Create the first proposal to get started</p>}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          isMember={isMember}
          voterAddress={voterAddress}
          quorumBps={quorumBps}
          checkHasVoted={checkHasVoted}
          onVote={onVote}
          onExecute={onExecute}
          onSuccess={onSuccess}
          onError={onError}
        />
      ))}
    </div>
  )
}
