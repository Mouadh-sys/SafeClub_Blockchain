"use client"

import { useState } from "react"
import { validateAddress, toChecksumAddress } from "@/src/lib/format"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CreateProposalFormProps {
  isMember: boolean
  onCreateProposal: (amount: string, recipient: string, description: string, deadline: number) => Promise<string>
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function CreateProposalForm({ isMember, onCreateProposal, onSuccess, onError }: CreateProposalFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    recipient: "",
    amount: "",
    description: "",
    deadlineType: "datetime" as "datetime" | "duration",
    deadlineDatetime: "",
    deadlineDuration: "60",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    const addressError = validateAddress(form.recipient)
    if (addressError) newErrors.recipient = addressError

    if (!form.amount || Number.parseFloat(form.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0"
    }

    if (!form.description.trim()) {
      newErrors.description = "Description is required"
    }

    const now = Math.floor(Date.now() / 1000)
    let deadline: number

    if (form.deadlineType === "datetime") {
      if (!form.deadlineDatetime) {
        newErrors.deadline = "Deadline is required"
      } else {
        deadline = Math.floor(new Date(form.deadlineDatetime).getTime() / 1000)
        if (deadline <= now + 60) {
          newErrors.deadline = "Deadline must be at least 1 minute in the future"
        }
      }
    } else {
      const duration = Number.parseInt(form.deadlineDuration)
      if (!duration || duration < 1) {
        newErrors.deadline = "Duration must be at least 1 minute"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const recipient = toChecksumAddress(form.recipient) || form.recipient
      const now = Math.floor(Date.now() / 1000)
      const deadline =
        form.deadlineType === "datetime"
          ? Math.floor(new Date(form.deadlineDatetime).getTime() / 1000)
          : now + Number.parseInt(form.deadlineDuration) * 60

      const txHash = await onCreateProposal(form.amount, recipient, form.description, deadline)
      onSuccess(`Proposal created! TX: ${txHash.slice(0, 10)}...`)
      setForm({
        recipient: "",
        amount: "",
        description: "",
        deadlineType: "datetime",
        deadlineDatetime: "",
        deadlineDuration: "60",
      })
      setIsOpen(false)
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to create proposal")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isMember) {
    return null
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" />
        Create Proposal
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>New Expense Proposal</span>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="recipient">Recipient Address</Label>
          <Input
            id="recipient"
            value={form.recipient}
            onChange={(e) => setForm({ ...form, recipient: e.target.value })}
            placeholder="0x..."
            className={errors.recipient ? "border-red-500" : ""}
          />
          {errors.recipient && <p className="text-red-500 text-xs mt-1">{errors.recipient}</p>}
        </div>

        <div>
          <Label htmlFor="amount">Amount (ETH)</Label>
          <Input
            id="amount"
            type="number"
            step="0.001"
            min="0"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0.1"
            className={errors.amount ? "border-red-500" : ""}
          />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the expense..."
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>

        <div>
          <Label>Voting Deadline</Label>
          <div className="flex gap-2 mb-2">
            <Button
              type="button"
              variant={form.deadlineType === "datetime" ? "default" : "outline"}
              size="sm"
              onClick={() => setForm({ ...form, deadlineType: "datetime" })}
            >
              Date/Time
            </Button>
            <Button
              type="button"
              variant={form.deadlineType === "duration" ? "default" : "outline"}
              size="sm"
              onClick={() => setForm({ ...form, deadlineType: "duration" })}
            >
              Duration
            </Button>
          </div>

          {form.deadlineType === "datetime" ? (
            <Input
              type="datetime-local"
              value={form.deadlineDatetime}
              onChange={(e) => setForm({ ...form, deadlineDatetime: e.target.value })}
              className={errors.deadline ? "border-red-500" : ""}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                value={form.deadlineDuration}
                onChange={(e) => setForm({ ...form, deadlineDuration: e.target.value })}
                className={errors.deadline ? "border-red-500" : ""}
              />
              <span className="text-sm text-muted-foreground">minutes from now</span>
            </div>
          )}
          {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>}
        </div>

        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full gap-2">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create Proposal
        </Button>
      </CardContent>
    </Card>
  )
}
