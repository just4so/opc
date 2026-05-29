'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Rocket, Shield, ExternalLink } from 'lucide-react'
import { ProfileSection } from './profile-section'
import { ProductsSection } from './products-section'
import { AccountSection } from './account-section'

type Section = 'profile' | 'products' | 'account'

const NAV_ITEMS: { key: Section; label: string; icon: React.ReactNode }[] = [
  { key: 'profile', label: '我的主页', icon: <User className="h-4 w-4" /> },
  { key: 'products', label: '我的产品', icon: <Rocket className="h-4 w-4" /> },
  { key: 'account', label: '账号与安全', icon: <Shield className="h-4 w-4" /> },
]

interface Props {
  username: string
  userId: string
}

export default function SettingsClient({ username, userId }: Props) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>('profile')

  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as Section
    if (['profile', 'products', 'account'].includes(hash)) {
      setActiveSection(hash)
    }
  }, [])

  const switchSection = (section: Section) => {
    setActiveSection(section)
    window.history.replaceState(null, '', `#${section}`)
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-ink">我的</h1>
          <Link
            href={`/profile/${username}`}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            预览我的公开主页
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <nav className="md:w-48 shrink-0">
            <div className="md:sticky md:top-24 space-y-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.key}
                  onClick={() => switchSection(item.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors text-left ${
                    activeSection === item.key
                      ? 'bg-primary text-on-dark'
                      : 'text-mute hover:bg-surface-card'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </nav>

          <div className="flex-1 min-w-0">
            {activeSection === 'profile' && <ProfileSection userId={userId} />}
            {activeSection === 'products' && <ProductsSection />}
            {activeSection === 'account' && <AccountSection />}
          </div>
        </div>
      </div>
    </div>
  )
}
