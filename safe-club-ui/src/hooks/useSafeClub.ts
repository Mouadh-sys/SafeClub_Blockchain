"use client"

import { useState, useCallback } from "react"
import { getReadContract, getWriteContract, getSettings, getBrowserProvider } from "@/src/lib/contract"
import { parseETH } from "@/src/lib/format"
import type { Proposal } from "@/src/lib/types"

export function useSafeClub() {
  const [balance, setBalance] = useState<bigint>(0n)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [members, setMembers] = useState<string[]>([])
  const [memberCount, setMemberCount] = useState<number>(0)
  const [quorumBps, setQuorumBps] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = useCallback(async () => {
    try {
      const contract = await getReadContract()
      if (!contract) return
      const bal = await contract.getBalance()
      setBalance(bal)
    } catch (err) {
      console.error("Failed to fetch balance:", err)
    }
  }, [])

  const fetchProposals = useCallback(async () => {
    try {
      const contract = await getReadContract()
      if (!contract) return

      const count = await contract.proposalCount()
      const proposalPromises: Promise<Proposal>[] = []

      for (let i = 0; i < Number(count); i++) {
        proposalPromises.push(
          contract.getProposal(i).then((p: [bigint, string, string, bigint, boolean, bigint, bigint, bigint]) => ({
            id: i,
            amount: p[0],
            recipient: p[1],
            description: p[2],
            deadline: Number(p[3]),
            executed: p[4],
            forVotes: p[5],
            againstVotes: p[6],
            membersSnapshot: Number(p[7]),
          })),
        )
      }

      const fetchedProposals = await Promise.all(proposalPromises)
      setProposals(fetchedProposals.reverse())
    } catch (err) {
      console.error("Failed to fetch proposals:", err)
    }
  }, [])

  const fetchMembers = useCallback(async () => {
    try {
      const contract = await getReadContract()
      if (!contract) return

      try {
        const memberList = await contract.getMembers()
        setMembers(memberList)
        setMemberCount(memberList.length)
      } catch {
        const count = await contract.memberCount()
        setMemberCount(Number(count))
        setMembers([])
      }
    } catch (err) {
      console.error("Failed to fetch members:", err)
    }
  }, [])

  const fetchQuorum = useCallback(async () => {
    try {
      const contract = await getReadContract()
      if (!contract) return

      try {
        const bps = await contract.quorumBps()
        setQuorumBps(Number(bps))
      } catch {
        setQuorumBps(null)
      }
    } catch (err) {
      console.error("Failed to fetch quorum:", err)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await Promise.all([fetchBalance(), fetchProposals(), fetchMembers(), fetchQuorum()])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setIsLoading(false)
    }
  }, [fetchBalance, fetchProposals, fetchMembers, fetchQuorum])

  const checkHasVoted = useCallback(async (proposalId: number, voter: string): Promise<boolean> => {
    try {
      const contract = await getReadContract()
      if (!contract) return false
      return await contract.hasVoted(proposalId, voter)
    } catch {
      return false
    }
  }, [])

  const createProposal = useCallback(
    async (amount: string, recipient: string, description: string, deadline: number): Promise<string> => {
      const contract = await getWriteContract()
      if (!contract) throw new Error("Contract not available")

      const amountWei = parseETH(amount)
      const tx = await contract.createProposal(amountWei, recipient, description, deadline)
      await tx.wait(1)
      await refreshAll()
      return tx.hash
    },
    [refreshAll],
  )

  const vote = useCallback(
    async (proposalId: number, support: boolean): Promise<string> => {
      const contract = await getWriteContract()
      if (!contract) throw new Error("Contract not available")

      const tx = await contract.vote(proposalId, support)
      await tx.wait(1)
      await refreshAll()
      return tx.hash
    },
    [refreshAll],
  )

  const executeProposal = useCallback(
    async (proposalId: number): Promise<string> => {
      const contract = await getWriteContract()
      if (!contract) throw new Error("Contract not available")

      const tx = await contract.executeProposal(proposalId)
      await tx.wait(1)
      await refreshAll()
      return tx.hash
    },
    [refreshAll],
  )

  const deposit = useCallback(
    async (amount: string): Promise<string> => {
      const provider = getBrowserProvider()
      if (!provider) throw new Error("Wallet not connected")

      const signer = await provider.getSigner()
      const settings = getSettings()

      const tx = await signer.sendTransaction({
        to: settings.contractAddress,
        value: parseETH(amount),
      })
      await tx.wait(1)
      await fetchBalance()
      return tx.hash
    },
    [fetchBalance],
  )

  const addMember = useCallback(
    async (address: string): Promise<string> => {
      const contract = await getWriteContract()
      if (!contract) throw new Error("Contract not available")

      const tx = await contract.addMember(address)
      await tx.wait(1)
      await fetchMembers()
      return tx.hash
    },
    [fetchMembers],
  )

  const removeMember = useCallback(
    async (address: string): Promise<string> => {
      const contract = await getWriteContract()
      if (!contract) throw new Error("Contract not available")

      const tx = await contract.removeMember(address)
      await tx.wait(1)
      await fetchMembers()
      return tx.hash
    },
    [fetchMembers],
  )

  return {
    balance,
    proposals,
    members,
    memberCount,
    quorumBps,
    isLoading,
    error,
    refreshAll,
    checkHasVoted,
    createProposal,
    vote,
    executeProposal,
    deposit,
    addMember,
    removeMember,
  }
}
