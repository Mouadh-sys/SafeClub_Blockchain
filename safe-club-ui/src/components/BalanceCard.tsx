"use client"

import { useState } from "react"
import { formatETH } from "@/src/lib/format"
import { Vault, ArrowDownToLine, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BalanceCardProps {
  balance: bigint
  isConnected: boolean
  onDeposit: (amount: string) => Promise<string>
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function BalanceCard({ balance, isConnected, onDeposit, onSuccess, onError }: BalanceCardProps) {
  const [depositAmount, setDepositAmount] = useState("")
  const [isDepositing, setIsDepositing] = useState(false)
  const [showDeposit, setShowDeposit] = useState(false)

  const handleDeposit = async () => {
    if (!depositAmount || Number.parseFloat(depositAmount) <= 0) {
      onError("Please enter a valid amount")
      return
    }

    setIsDepositing(true)
    try {
      const txHash = await onDeposit(depositAmount)
      onSuccess(`Deposit successful! TX: ${txHash.slice(0, 10)}...`)
      setDepositAmount("")
      setShowDeposit(false)
    } catch (err) {
      onError(err instanceof Error ? err.message : "Deposit failed")
    } finally {
      setIsDepositing(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Vault className="w-5 h-5" />
          Treasury Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold mb-4">{formatETH(balance)}</p>

        {isConnected && (
          <>
            {!showDeposit ? (
              <Button variant="outline" size="sm" onClick={() => setShowDeposit(true)} className="gap-2">
                <ArrowDownToLine className="w-4 h-4" />
                Deposit ETH
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Amount in ETH"
                  className="flex-1"
                />
                <Button onClick={handleDeposit} disabled={isDepositing} size="sm">
                  {isDepositing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowDeposit(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
