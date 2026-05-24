'use client'

import { CommunityClaimDialog } from './community-claim-dialog'

export function CommunityClaimTrigger({
  communityId,
  communityName,
}: {
  communityId: string
  communityName: string
}) {
  return (
    <div className="text-center text-sm text-mute mt-2">
      <span>你是该社区的运营方？</span>
      <CommunityClaimDialog communityId={communityId} communityName={communityName}>
        <button className="text-primary hover:underline ml-1">
          联系我们认领 →
        </button>
      </CommunityClaimDialog>
    </div>
  )
}
