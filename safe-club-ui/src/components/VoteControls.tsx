"use client"

import { useState, useEffect } from "react"
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VoteControlsProps {
  proposalId: number
  isMember: boolean
  isActive: boolean
  voterAddress: string | null
  checkHasVoted: (proposalId: number, voter: string) => Promise<boolean>
  onVote: (proposalId: number, support: boolean) => Promise<string>
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function VoteControls({
  proposalId,
  isMember,
  isActive,
  voterAddress,
  checkHasVoted,
  onVote,
  onSuccess,
  onError,
}: VoteControlsProps) {
  const [hasVoted, setHasVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkVoteStatus = async () => {
      if (!voterAddress) {
        setIsChecking(false)
        return
      }
      setIsChecking(true)
      const voted = await checkHasVoted(proposalId, voterAddress)
      setHasVoted(voted)
      setIsChecking(false)
    }
    checkVoteStatus()
  }, [proposalId, voterAddress, checkHasVoted])

  const handleVote = async (support: boolean) => {
    setIsVoting(true)
    try {
      const txHash = await onVote(proposalId, support)
      onSuccess(`Vote recorded! TX: ${txHash.slice(0, 10)}...`)
      setHasVoted(true)
    } catch (err) {
      onError(err instanceof Error ? err.message : "Vote failed")
    } finally {
      setIsVoting(false)
    }
  }

  if (!isMember || !isActive) return null

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking vote status...
      </div>
    )
  }

  if (hasVoted) {
    return <p className="text-sm text-muted-foreground">You have already voted on this proposal</p>
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleVote(true)}
        disabled={isVoting}
        className="gap-2 border-green-700 text-green-400 hover:bg-green-900/50"
      >
        {isVoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
        Vote For
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleVote(false)}
        disabled={isVoting}
        className="gap-2 border-red-700 text-red-400 hover:bg-red-900/50"
      >
        {isVoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
        Vote Against
      </Button>
    </div>
  )
}
