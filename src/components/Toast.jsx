import { useState, useCallback, useEffect } from 'react'

export function useToast() {
  const [toast, setToast] = useState(null)

  const show = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
  }, [])

  const hide = useCallback(() => setToast(null), [])

  return { toast, show, hide }
}

export default function Toast({ toast, onHide }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onHide, 3000)
    return () => clearTimeout(t)
  }, [toast?.id])

  if (!toast) return null

  const isSuccess = toast.type === 'success'

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium text-white flex items-center gap-2 transition-all animate-fade-up max-w-xs text-center ${
        isSuccess ? 'bg-green-500' : 'bg-red-500'
      }`}
    >
      <span>{isSuccess ? '✅' : '❌'}</span>
      <span>{toast.message}</span>
    </div>
  )
}
