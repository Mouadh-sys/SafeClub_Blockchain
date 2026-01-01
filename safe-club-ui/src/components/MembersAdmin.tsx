"use client"

import { useState } from "react"
import { validateAddress, toChecksumAddress, shortenAddress } from "@/src/lib/format"
import { Users, UserPlus, UserMinus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MembersAdminProps {
  isOwner: boolean
  members: string[]
  memberCount: number
  onAddMember: (address: string) => Promise<string>
  onRemoveMember: (address: string) => Promise<string>
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function MembersAdmin({
  isOwner,
  members,
  memberCount,
  onAddMember,
  onRemoveMember,
  onSuccess,
  onError,
}: MembersAdminProps) {
  const [newMember, setNewMember] = useState("")
  const [removeMember, setRemoveMember] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [error, setError] = useState("")

  if (!isOwner) return null

  const handleAdd = async () => {
    const validationError = validateAddress(newMember)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsAdding(true)
    setError("")
    try {
      const address = toChecksumAddress(newMember) || newMember
      const txHash = await onAddMember(address)
      onSuccess(`Member added! TX: ${txHash.slice(0, 10)}...`)
      setNewMember("")
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to add member")
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemove = async (address?: string) => {
    const addressToRemove = address || removeMember
    const validationError = validateAddress(addressToRemove)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsRemoving(true)
    setError("")
    try {
      const checksumAddress = toChecksumAddress(addressToRemove) || addressToRemove
      const txHash = await onRemoveMember(checksumAddress)
      onSuccess(`Member removed! TX: ${txHash.slice(0, 10)}...`)
      setRemoveMember("")
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to remove member")
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Members Management
          <Badge variant="secondary">{memberCount} members</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {members.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Current Members:</p>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <div key={member} className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm">
                  <span className="font-mono">{shortenAddress(member)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleRemove(member)}
                    disabled={isRemoving}
                  >
                    <UserMinus className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="space-y-2">
          <p className="text-sm font-medium">Add Member:</p>
          <div className="flex gap-2">
            <Input
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              placeholder="0x..."
              className="flex-1"
            />
            <Button onClick={handleAdd} disabled={isAdding} className="gap-2">
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Add
            </Button>
          </div>
        </div>

        {members.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Remove Member:</p>
            <div className="flex gap-2">
              <Input
                value={removeMember}
                onChange={(e) => setRemoveMember(e.target.value)}
                placeholder="0x..."
                className="flex-1"
              />
              <Button variant="destructive" onClick={() => handleRemove()} disabled={isRemoving} className="gap-2">
                {isRemoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                Remove
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
