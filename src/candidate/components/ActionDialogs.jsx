import { useEffect, useState } from 'react'

export function ConfirmDialog({ open, title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false, onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 px-3 py-4">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-2xl ring-1 ring-slate-200 sm:p-5">
        <h3 className="text-lg font-bold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="min-h-10 w-full rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto">
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-10 w-full rounded-lg px-4 text-sm font-semibold text-white sm:w-auto ${danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-sky-600 hover:bg-sky-700'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export function PromptDialog({
  open,
  title,
  message,
  value = '',
  placeholder = '',
  confirmText = 'Save',
  cancelText = 'Cancel',
  inputType = 'password',
  onConfirm,
  onCancel
}) {
  const [input, setInput] = useState(value)

  useEffect(() => {
    if (open) setInput(value || '')
  }, [open, value])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 px-3 py-4">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-2xl ring-1 ring-slate-200 sm:p-5">
        <h3 className="text-lg font-bold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <input
          autoFocus
          type={inputType}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={placeholder}
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
        />
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="min-h-10 w-full rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto">
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(input)}
            className="min-h-10 w-full rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700 sm:w-auto"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
