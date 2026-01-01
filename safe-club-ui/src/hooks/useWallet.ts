"use client"

import { useState, useEffect, useCallback } from "react"
import { getBrowserProvider, getReadContract } from "@/src/lib/contract"
import type { WalletState } from "@/src/lib/types"

const initialState: WalletState = {
  address: null,
  chainId: null,
  isConnected: false,
  isMember: false,
  isOwner: false,
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>(initialState)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkMembershipAndOwnership = useCallback(async (address: string) => {
    try {
      const contract = await getReadContract()
      if (!contract) return { isMember: false, isOwner: false }

      const [isMember, owner] = await Promise.all([
        contract.isMember(address).catch(() => false),
        contract.owner().catch(() => null),
      ])

      return {
        isMember: Boolean(isMember),
        isOwner: owner?.toLowerCase() === address.toLowerCase(),
      }
    } catch {
      return { isMember: false, isOwner: false }
    }
  }, [])

  const updateWalletState = useCallback(async () => {
    const provider = getBrowserProvider()
    if (!provider) {
      setWallet(initialState)
      return
    }

    try {
      const accounts = await provider.listAccounts()
      if (accounts.length === 0) {
        setWallet(initialState)
        return
      }

      const address = accounts[0].address
      const network = await provider.getNetwork()
      const chainId = Number(network.chainId)
      const { isMember, isOwner } = await checkMembershipAndOwnership(address)

      setWallet({
        address,
        chainId,
        isConnected: true,
        isMember,
        isOwner,
      })
    } catch {
      setWallet(initialState)
    }
  }, [checkMembershipAndOwnership])

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask not detected. Please install MetaMask.")
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" })
      await updateWalletState()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }, [updateWalletState])

  const disconnect = useCallback(() => {
    setWallet(initialState)
  }, [])

  useEffect(() => {
    updateWalletState()

    if (!window.ethereum) return

    const handleAccountsChanged = () => {
      updateWalletState()
    }

    const handleChainChanged = () => {
      updateWalletState()
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged)
    window.ethereum.on("chainChanged", handleChainChanged)

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged)
      window.ethereum?.removeListener("chainChanged", handleChainChanged)
    }
  }, [updateWalletState])

  return {
    wallet,
    isConnecting,
    error,
    connect,
    disconnect,
    refresh: updateWalletState,
  }
}
