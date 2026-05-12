export default function BrandLogo({ className = '', compact = false }) {
  if (compact) {
    return (
      <img
        src="/success-logo.png"
        alt="Success HR Solutions"
        className={`block h-12 w-32 shrink-0 object-contain ${className}`}
      />
    )
  }

  return <img src="/success-logo.png" alt="Success HR Solutions" className={`block h-auto w-full object-contain ${className}`} />
}
