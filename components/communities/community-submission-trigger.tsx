'use client'

import { CommunitySubmissionDialog } from './community-submission-dialog'

export function CommunitySubmissionTrigger() {
  return (
    <div className="text-center py-6">
      <span className="text-sm text-mute">没找到你的社区？</span>
      <CommunitySubmissionDialog>
        <button className="text-sm text-primary hover:underline ml-1">
          申请收录 →
        </button>
      </CommunitySubmissionDialog>
    </div>
  )
}
