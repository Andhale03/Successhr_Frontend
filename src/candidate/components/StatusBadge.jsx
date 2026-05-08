const statusConfig = {
  not_viewed: {
    label: 'Not Viewed',
    classes: 'bg-slate-100 text-slate-700 ring-slate-200'
  },
  in_review: {
    label: 'In Review',
    classes: 'bg-blue-50 text-blue-700 ring-blue-200'
  },
  priority: {
    label: 'Priority',
    classes: 'bg-amber-50 text-amber-700 ring-amber-200'
  },
  done: {
    label: 'Done',
    classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  }
}

export const statusLabel = (status) => statusConfig[status]?.label || status

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.not_viewed

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${config.classes}`}>
      {config.label}
    </span>
  )
}
