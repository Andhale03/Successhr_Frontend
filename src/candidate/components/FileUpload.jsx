import { UploadCloud, X } from 'lucide-react'

export default function FileUpload({ files = [], onFiles, onRemove, multiple = false, accept = 'image/*,.pdf' }) {
  const handleChange = (event) => {
    const selected = Array.from(event.target.files || [])
    if (selected.length) {
      onFiles?.(selected)
    }
    event.target.value = ''
  }

  return (
    <div className="space-y-3">
      <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center hover:border-cyan-400 hover:bg-sky-50/40">
        <UploadCloud className="mb-2 h-8 w-8 text-sky-500" />
        <span className="text-sm font-semibold text-slate-800">Choose files</span>
        <span className="mt-1 text-xs text-slate-500">JPG, PNG, or PDF up to 5MB</span>
        <input type="file" className="sr-only" accept={accept} multiple={multiple} onChange={handleChange} />
      </label>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-sm">
              <span className="truncate pr-3 text-slate-700">{file.name}</span>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 hover:text-rose-600"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
