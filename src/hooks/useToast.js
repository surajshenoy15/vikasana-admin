import { useState, useCallback } from 'react'

let toastId = 0

/**
 * useToast — lightweight toast notification hook.
 * Usage: const { toasts, toast } = useToast()
 *        toast.success('Done!') | toast.error('Oops') | toast.info('Note')
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  return {
    toasts,
    toast: {
      success: (msg) => addToast(msg, 'success'),
      error:   (msg) => addToast(msg, 'error'),
      info:    (msg) => addToast(msg, 'info'),
    },
  }
}
