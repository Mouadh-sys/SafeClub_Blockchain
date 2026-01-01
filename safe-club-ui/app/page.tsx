"use client"

import { useEffect, useState, useCallback } from "react"
import { useWallet } from "@/src/hooks/useWallet"
import { useSafeClub } from "@/src/hooks/useSafeClub"
import { getSettings } from "@/src/lib/contract"
import { WalletBar } from "@/src/components/WalletBar"
import { SettingsPanel } from "@/src/components/SettingsPanel"
import { BalanceCard } from "@/src/components/BalanceCard"
import { CreateProposalForm } from "@/src/components/CreateProposalForm"
import { ProposalsList } from "@/src/components/ProposalsList"
import { MembersAdmin } from "@/src/components/MembersAdmin"
import { Toasts } from "@/src/components/Toasts"
import type { Toast } from "@/src/lib/types"
import { RefreshCw, AlertTriangle, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function Home() {
  const { wallet, isConnecting, error: walletError, connect, disconnect, refresh: refreshWallet } = useWallet()
  const {
    balance,
    proposals,
    members,
    memberCount,
    quorumBps,
    isLoading,
    refreshAll,
    checkHasVoted,
    createProposal,
    vote,
    executeProposal,
    deposit,
    addMember,
    removeMember,
  } = useSafeClub()

  const [toasts, setToasts] = useState<Toast[]>([])
  const [hasContract, setHasContract] = useState(false)
  const [hasMetaMask, setHasMetaMask] = useState<boolean | null>(null)

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const onSuccess = useCallback((message: string) => addToast("success", message), [addToast])
  const onError = useCallback((message: string) => addToast("error", message), [addToast])

  const checkContractConfig = useCallback(() => {
    const settings = getSettings()
    setHasContract(!!settings.contractAddress)
  }, [])

  useEffect(() => {
    checkContractConfig()
    setHasMetaMask(typeof window !== "undefined" && !!window.ethereum)
  }, [checkContractConfig])

  useEffect(() => {
    if (hasContract) {
      refreshAll()
    }
  }, [hasContract, refreshAll])

  const handleSettingsChange = useCallback(() => {
    checkContractConfig()
    refreshWallet()
    refreshAll()
  }, [checkContractConfig, refreshWallet, refreshAll])

  const handleRefresh = useCallback(() => {
    refreshWallet()
    refreshAll()
  }, [refreshWallet, refreshAll])

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">SafeClub</h1>
              <p className="text-xs text-muted-foreground">Student Club Treasury</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SettingsPanel onSettingsChange={handleSettingsChange} />
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading} title="Refresh">
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <WalletBar wallet={wallet} isConnecting={isConnecting} onConnect={connect} onDisconnect={disconnect} />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {walletError && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{walletError}</AlertDescription>
          </Alert>
        )}

        {!hasContract && (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              No contract address configured. Click Settings to configure your SafeClub contract address and chain.
            </AlertDescription>
          </Alert>
        )}

        {!wallet.isConnected && hasMetaMask === false && (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              MetaMask not detected. Please install MetaMask to interact with the contract.
              {hasContract && " You can still view data in read-only mode if an RPC URL is configured."}
            </AlertDescription>
          </Alert>
        )}

        {hasContract && (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <BalanceCard
                balance={balance}
                isConnected={wallet.isConnected}
                onDeposit={deposit}
                onSuccess={onSuccess}
                onError={onError}
              />

              <div className="space-y-4">
                <CreateProposalForm
                  isMember={wallet.isMember}
                  onCreateProposal={createProposal}
                  onSuccess={onSuccess}
                  onError={onError}
                />

                {wallet.isConnected && !wallet.isMember && (
                  <Alert>
                    <AlertDescription>
                      You are not a member of this club. Contact the owner to be added as a member to create proposals
                      and vote.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <section>
              <h2 className="text-2xl font-bold mb-4">Proposals</h2>
              <ProposalsList
                proposals={proposals}
                isMember={wallet.isMember}
                voterAddress={wallet.address}
                quorumBps={quorumBps}
                checkHasVoted={checkHasVoted}
                onVote={vote}
                onExecute={executeProposal}
                onSuccess={onSuccess}
                onError={onError}
              />
            </section>

            <MembersAdmin
              isOwner={wallet.isOwner}
              members={members}
              memberCount={memberCount}
              onAddMember={addMember}
              onRemoveMember={removeMember}
              onSuccess={onSuccess}
              onError={onError}
            />
          </>
        )}
      </div>

      <Toasts toasts={toasts} removeToast={removeToast} />
    </main>
  )
}
