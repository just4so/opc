'use client'

import { UserNav } from './user-nav'
import { MobileMenu } from './mobile-menu'
import { UnreadProvider } from './unread-provider'

export function NavActions() {
  return (
    <UnreadProvider>
      <div className="hidden md:flex">
        <UserNav />
      </div>
      <MobileMenu />
    </UnreadProvider>
  )
}
