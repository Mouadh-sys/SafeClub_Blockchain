"use client"

import type { Proposal, ProposalStatus } from "@/src/lib/types"
import { formatETH, formatDate, getTimeRemaining, shortenAddress } from "@/src/lib/format"
import { VoteControls } from "./VoteControls"
import { ExecuteButton } from "./ExecuteButton"
import { Copy, Check, Clock, User, FileText } from "lucide-react"
import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ProposalCardProps {
  proposal: Proposal
  isMember: boolean
  voterAddress: string | null
  quorumBps: number | null
  checkHasVoted: (proposalId: number, voter: string) => Promise<boolean>
  onVote: (proposalId: number, support: boolean) => Promise<string>
  onExecute: (proposalId: number) => Promise<string>
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function ProposalCard({
  proposal,
  isMember,
  voterAddress,
  quorumBps,
  checkHasVoted,
  onVote,
  onExecute,
  onSuccess,
  onError,
}: ProposalCardProps) {
  const [copied, setCopied] = useState(false)

  const now = Math.floor(Date.now() / 1000)
  const status: ProposalStatus = proposal.executed ? "executed" : now < proposal.deadline ? "active" : "ready"

  const copyAddress = () => {
    navigator.clipboard.writeText(proposal.recipient)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const totalVotes = Number(proposal.forVotes) + Number(proposal.againstVotes)
  const forPercentage = totalVotes > 0 ? (Number(proposal.forVotes) / totalVotes) * 100 : 0

  let acceptanceInfo = "Acceptance rule enforced on-chain"
  if (quorumBps !== null && proposal.membersSnapshot > 0) {
    const quorumRequired = Math.ceil((proposal.membersSnapshot * quorumBps) / 10000)
    const accepted = totalVotes >= quorumRequired && Number(proposal.forVotes) > Number(proposal.againstVotes)
    acceptanceInfo = accepted ? "✓ Meets acceptance criteria" : `✗ Needs ${quorumRequired} votes & majority`
  }

  const statusColors = {
    active: "bg-blue-900/50 text-blue-400 border-blue-700",
    ready: "bg-yellow-900/50 text-yellow-400 border-yellow-700",
    executed: "bg-green-900/50 text-green-400 border-green-700",
  }

  const statusLabels = {
    active: "Active",
    ready: "Ready to Execute",
    executed: "Executed",
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Proposal #{proposal.id}</span>
          <Badge variant="outline" className={statusColors[status]}>
            {statusLabels[status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{formatETH(proposal.amount)}</span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">To:</span>
            <span className="font-mono">{shortenAddress(proposal.recipient)}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>

          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
            <p className="flex-1">{proposal.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{formatDate(proposal.deadline)}</span>
            <span className="text-muted-foreground">({getTimeRemaining(proposal.deadline)})</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              Votes: {Number(proposal.forVotes)} For / {Number(proposal.againstVotes)} Against
            </span>
            <span className="text-muted-foreground">{totalVotes} total</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${forPercentage}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{acceptanceInfo}</p>
        </div>

        <div className="pt-2 border-t space-y-2">
          <VoteControls
            proposalId={proposal.id}
            isMember={isMember}
            isActive={status === "active"}
            voterAddress={voterAddress}
            checkHasVoted={checkHasVoted}
            onVote={onVote}
            onSuccess={onSuccess}
            onError={onError}
          />
          <ExecuteButton
            proposalId={proposal.id}
            isMember={isMember}
            isReady={status === "ready"}
            onExecute={onExecute}
            onSuccess={onSuccess}
            onError={onError}
          />
        </div>
      </CardContent>
    </Card>
  )
}
