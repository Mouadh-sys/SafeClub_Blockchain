"use client"

import { useEffect } from "react"
import type { Toast } from "@/src/lib/types"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"

interface ToastsProps {
  toasts: Toast[]
  removeToast: (id: string) => void
}

export function Toasts({ toasts, removeToast }: ToastsProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, 5000)
    return () => clearTimeout(timer)
  }, [onRemove])

  const bgColor = {
    success: "bg-green-900/90 border-green-700",
    error: "bg-red-900/90 border-red-700",
    info: "bg-blue-900/90 border-blue-700",
  }[toast.type]

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }[toast.type]

  return (
    <div className={`${bgColor} border rounded-lg p-4 shadow-lg flex items-start gap-3 animate-in slide-in-from-right`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <p className="text-sm flex-1">{toast.message}</p>
      <button onClick={onRemove} className="shrink-0 hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
