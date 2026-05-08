export default function BrandLogo({ className = '', compact = false }) {
  if (compact) {
    return (
      <img
        src="/success-mark.svg"
        alt="Success HR Solutions"
        className={`block h-11 w-11 shrink-0 rounded-xl object-contain ${className}`}
      />
    )
  }

  return <img src="/success-logo.svg" alt="Success HR Solutions" className={`block h-auto w-full object-contain ${className}`} />
}
