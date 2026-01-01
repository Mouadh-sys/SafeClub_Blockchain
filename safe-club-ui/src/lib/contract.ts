import { BrowserProvider, JsonRpcProvider, Contract, type Signer } from "ethers"
import SafeClubABI from "@/src/abi/SafeClub.json"
import type { Settings } from "./types"

const STORAGE_KEY = "safeclub_settings"

export function getSettings(): Settings {
  if (typeof window === "undefined") {
    return {
      contractAddress: "",
      chainId: 31337,
      rpcUrl: "",
    }
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // Fall through to defaults
    }
  }

  return {
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
    chainId: Number.parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "31337"),
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "",
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function getBrowserProvider(): BrowserProvider | null {
  if (typeof window === "undefined" || !window.ethereum) return null
  return new BrowserProvider(window.ethereum)
}

export function getReadOnlyProvider(rpcUrl?: string): JsonRpcProvider | null {
  const url = rpcUrl || getSettings().rpcUrl
  if (!url) return null
  return new JsonRpcProvider(url)
}

export async function getSigner(): Promise<Signer | null> {
  const provider = getBrowserProvider()
  if (!provider) return null
  try {
    return await provider.getSigner()
  } catch {
    return null
  }
}

export function getContract(signerOrProvider: Signer | BrowserProvider | JsonRpcProvider): Contract | null {
  const settings = getSettings()
  if (!settings.contractAddress) return null
  return new Contract(settings.contractAddress, SafeClubABI, signerOrProvider)
}

export async function getReadContract(): Promise<Contract | null> {
  const provider = getBrowserProvider()
  if (provider) {
    return getContract(provider)
  }
  const readOnly = getReadOnlyProvider()
  if (readOnly) {
    return getContract(readOnly)
  }
  return null
}

export async function getWriteContract(): Promise<Contract | null> {
  const signer = await getSigner()
  if (!signer) return null
  return getContract(signer)
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, callback: (...args: unknown[]) => void) => void
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void
      isMetaMask?: boolean
    }
  }
}
