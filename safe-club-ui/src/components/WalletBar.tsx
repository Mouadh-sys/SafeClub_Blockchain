"use client"

import { shortenAddress } from "@/src/lib/format"
import type { WalletState } from "@/src/lib/types"
import { Wallet, LogOut, Shield, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WalletBarProps {
  wallet: WalletState
  isConnecting: boolean
  onConnect: () => void
  onDisconnect: () => void
}

export function WalletBar({ wallet, isConnecting, onConnect, onDisconnect }: WalletBarProps) {
  if (!wallet.isConnected) {
    return (
      <Button onClick={onConnect} disabled={isConnecting} className="gap-2">
        <Wallet className="w-4 h-4" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm">
        {wallet.isOwner && (
          <span className="flex items-center gap-1 px-2 py-1 bg-amber-900/50 border border-amber-700 rounded text-amber-400 text-xs">
            <Crown className="w-3 h-3" />
            Owner
          </span>
        )}
        {wallet.isMember && (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-900/50 border border-green-700 rounded text-green-400 text-xs">
            <Shield className="w-3 h-3" />
            Member
          </span>
        )}
        <span className="px-2 py-1 bg-muted rounded text-xs">Chain: {wallet.chainId}</span>
        <span className="font-mono">{shortenAddress(wallet.address || "")}</span>
      </div>
      <Button variant="outline" size="sm" onClick={onDisconnect} className="gap-2 bg-transparent">
        <LogOut className="w-4 h-4" />
        Disconnect
      </Button>
    </div>
  )
}
