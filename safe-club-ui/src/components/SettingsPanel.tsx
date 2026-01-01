"use client"

import { useState, useEffect } from "react"
import { getSettings, saveSettings } from "@/src/lib/contract"
import { validateAddress, toChecksumAddress } from "@/src/lib/format"
import type { Settings } from "@/src/lib/types"
import { SettingsIcon, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SettingsPanelProps {
  onSettingsChange: () => void
}

export function SettingsPanel({ onSettingsChange }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    contractAddress: "",
    chainId: 31337,
    rpcUrl: "",
  })
  const [errors, setErrors] = useState<{ address?: string }>({})

  useEffect(() => {
    setSettings(getSettings())
  }, [])

  const handleSave = () => {
    const addressError = settings.contractAddress ? validateAddress(settings.contractAddress) : null
    if (addressError) {
      setErrors({ address: addressError })
      return
    }

    const checksumAddress = settings.contractAddress ? toChecksumAddress(settings.contractAddress) : ""
    const finalSettings = {
      ...settings,
      contractAddress: checksumAddress || settings.contractAddress,
    }

    saveSettings(finalSettings)
    setSettings(finalSettings)
    setErrors({})
    setIsOpen(false)
    onSettingsChange()
  }

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="gap-2">
        <SettingsIcon className="w-4 h-4" />
        Settings
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Contract Settings</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="contractAddress">Contract Address</Label>
            <Input
              id="contractAddress"
              value={settings.contractAddress}
              onChange={(e) => setSettings({ ...settings, contractAddress: e.target.value })}
              placeholder="0x..."
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>

          <div>
            <Label htmlFor="chainId">Chain ID</Label>
            <Input
              id="chainId"
              type="number"
              value={settings.chainId}
              onChange={(e) => setSettings({ ...settings, chainId: Number.parseInt(e.target.value) || 1 })}
              placeholder="31337"
            />
            <p className="text-xs text-muted-foreground mt-1">Common: 1 (Mainnet), 11155111 (Sepolia), 31337 (Local)</p>
          </div>

          <div>
            <Label htmlFor="rpcUrl">RPC URL (Optional)</Label>
            <Input
              id="rpcUrl"
              value={settings.rpcUrl}
              onChange={(e) => setSettings({ ...settings, rpcUrl: e.target.value })}
              placeholder="http://localhost:8545"
            />
            <p className="text-xs text-muted-foreground mt-1">For read-only access when wallet is not connected</p>
          </div>

          <Button onClick={handleSave} className="w-full gap-2">
            <Save className="w-4 h-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
