"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/communities", label: "社区地图" },
  { href: "/plaza", label: "创业广场" },
  { href: "/market", label: "合作广场" },
  { href: "/news", label: "创业资讯" },
  { href: "/tools", label: "工具导航" },
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
                ? "px-4 py-2 text-sm font-medium text-primary bg-primary-50 rounded-lg"
                : "px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary hover:bg-primary-50 rounded-lg transition-all"
            }
          >
            {link.label}
          </Link>
        )
      })}
    </>
  )
}
