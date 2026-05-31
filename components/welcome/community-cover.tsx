'use client'

interface Props {
  src: string
  alt: string
  fallbackText: string
  gradFrom: string
  gradTo: string
  gradColor: string
}

export function CommunityCover({ src, alt, fallbackText, gradFrom, gradTo, gradColor }: Props) {
  return (
    <div className="h-40 overflow-hidden">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
        onError={(e) => {
          const el = e.currentTarget
          const parent = el.parentElement!
          el.style.display = 'none'
          parent.style.background = `linear-gradient(135deg, ${gradFrom}, ${gradTo})`
          parent.style.display = 'flex'
          parent.style.alignItems = 'center'
          parent.style.justifyContent = 'center'
          parent.innerHTML = `<span style="color:${gradColor};font-size:1.5rem;font-weight:800">${fallbackText}</span>`
        }}
      />
    </div>
  )
}
