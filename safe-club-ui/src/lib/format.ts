import { formatEther, parseEther, isAddress, getAddress } from "ethers"

export function formatETH(wei: bigint): string {
  const eth = formatEther(wei)
  const num = Number.parseFloat(eth)
  if (num === 0) return "0 ETH"
  if (num < 0.0001) return "<0.0001 ETH"
  return `${num.toFixed(4)} ETH`
}

export function parseETH(eth: string): bigint {
  return parseEther(eth)
}

export function shortenAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString()
}

export function getTimeRemaining(deadline: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = deadline - now

  if (diff <= 0) return "Voting ended"

  const days = Math.floor(diff / 86400)
  const hours = Math.floor((diff % 86400) / 3600)
  const minutes = Math.floor((diff % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h remaining`
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}

export function validateAddress(address: string): string | null {
  if (!address) return "Address is required"
  if (!isAddress(address)) return "Invalid Ethereum address"
  try {
    getAddress(address)
    return null
  } catch {
    return "Invalid checksum address"
  }
}

export function toChecksumAddress(address: string): string | null {
  try {
    return getAddress(address)
  } catch {
    return null
  }
}
