'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PostItem {
  id: string
  content: string
  author: {
    name: string | null
    username: string | null
  }
}

interface ActivityBarProps {
  initialPosts: PostItem[]
}

export function ActivityBar({ initialPosts }: ActivityBarProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (initialPosts.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % initialPosts.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [initialPosts.length])

  if (initialPosts.length === 0) return null

  const truncate = (text: string, max: number) => {
    const firstLine = text.split('\n')[0]
    return firstLine.length > max ? firstLine.slice(0, max) + '…' : firstLine
  }

  const current = initialPosts[currentIndex]
  const authorName = current.author.name || current.author.username || '匿名'

  return (
    <div className="bg-gray-800 h-11 flex items-center overflow-hidden">
      <div className="container mx-auto px-4 flex items-center min-w-0">
        <span className="text-orange-400 font-medium text-sm whitespace-nowrap shrink-0">
          🔥 最新动态：
        </span>
        <Link
          href={`/plaza/${current.id}`}
          className="ml-2 text-sm text-gray-300 hover:text-white transition-colors truncate min-w-0"
        >
          {truncate(current.content, 30)}
          <span className="text-gray-500 ml-2">— {authorName}</span>
        </Link>
      </div>
    </div>
  )
}
