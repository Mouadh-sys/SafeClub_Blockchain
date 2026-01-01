export interface Proposal {
  id: number
  amount: bigint
  recipient: string
  description: string
  deadline: number
  executed: boolean
  forVotes: bigint
  againstVotes: bigint
  membersSnapshot: number
}

export type ProposalStatus = "active" | "ready" | "executed"

export interface WalletState {
  address: string | null
  chainId: number | null
  isConnected: boolean
  isMember: boolean
  isOwner: boolean
}

export interface Settings {
  contractAddress: string
  chainId: number
  rpcUrl: string
}

export interface Toast {
  id: string
  type: "success" | "error" | "info"
  message: string
}
