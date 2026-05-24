"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/communities", label: "找社区" },
  { href: "/plaza", label: "广场" },
  { href: "/news", label: "资讯" },
  { href: "/radar", label: "雷达" },
]

export function NavLinks() {
  const pathname = usePathname()
  return (
    <>
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              isActive
                ? "px-4 py-2 text-sm font-semibold text-ink border-b-2 border-primary"
                : "px-4 py-2 text-sm font-medium text-mute hover:text-ink border-b-2 border-transparent transition-all"
            }
          >
            {link.label}
          </Link>
        )
      })}
    </>
  )
}
