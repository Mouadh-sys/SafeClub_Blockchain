"use client"

import { useState } from "react"
import { Play, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ExecuteButtonProps {
  proposalId: number
  isMember: boolean
  isReady: boolean
  onExecute: (proposalId: number) => Promise<string>
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function ExecuteButton({ proposalId, isMember, isReady, onExecute, onSuccess, onError }: ExecuteButtonProps) {
  const [isExecuting, setIsExecuting] = useState(false)

  if (!isMember || !isReady) return null

  const handleExecute = async () => {
    setIsExecuting(true)
    try {
      const txHash = await onExecute(proposalId)
      onSuccess(`Proposal executed! TX: ${txHash.slice(0, 10)}...`)
    } catch (err) {
      onError(err instanceof Error ? err.message : "Execution failed")
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <Button onClick={handleExecute} disabled={isExecuting} className="gap-2 bg-green-700 hover:bg-green-600">
      {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
      Execute Proposal
    </Button>
  )
}
