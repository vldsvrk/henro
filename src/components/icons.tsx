type IconProps = { className?: string }

const base = {
  width: 14,
  height: 14,
  viewBox: '0 0 18 18',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function BranchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <line x1="4.75" y1="5.75" x2="4.75" y2="12.25" />
      <path d="M13.25,5.75v1c0,1.105-.895,2-2,2H6.75c-1.105,0-2,.895-2,2" />
      <circle cx="4.75" cy="3.75" r="2" />
      <circle cx="13.25" cy="3.75" r="2" />
      <circle cx="4.75" cy="14.25" r="2" />
    </svg>
  )
}

export function PromptIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9,1.75C4.996,1.75,1.75,4.996,1.75,9c0,1.319,.358,2.552,.973,3.617,.43,.806-.053,2.712-.973,3.633,1.25,.068,2.897-.497,3.633-.973,.489,.282,1.264,.656,2.279,.848,.433,.082,.881,.125,1.338,.125,4.004,0,7.25-3.246,7.25-7.25S13.004,1.75,9,1.75Z" />
    </svg>
  )
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <line x1="14" y1="4" x2="4" y2="14" />
      <line x1="4" y1="4" x2="14" y2="14" />
    </svg>
  )
}
