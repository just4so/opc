'use client'
import { useEffect, useState } from 'react'

interface DataPoint {
  date: string
  users: number
  posts: number
}

export function TrendChart() {
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-40 bg-gray-50 rounded animate-pulse" />
  if (!data.length) return <div className="h-40 flex items-center justify-center text-gray-400 text-sm">暂无数据</div>

  const maxVal = Math.max(...data.flatMap(d => [d.users, d.posts]), 1)

  const toPoints = (key: keyof DataPoint) =>
    data.map((d, i) => {
      const x = (i / (data.length - 1)) * 96 + 2
      const y = 90 - (Number(d[key]) / maxVal) * 75
      return `${x},${y}`
    }).join(' ')

  return (
    <div>
      <div className="flex gap-4 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-blue-500 inline-block rounded" /> 新增用户
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-green-500 inline-block rounded" /> 新增帖子
        </span>
      </div>
      <div className="relative">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-36 border-l border-b border-gray-100">
          {/* 网格线 */}
          {[25, 50, 75].map(y => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f3f4f6" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
          ))}
          {/* 用户折线 */}
          <polyline points={toPoints('users')} fill="none" stroke="#3b82f6" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          {/* 帖子折线 */}
          <polyline points={toPoints('posts')} fill="none" stroke="#22c55e" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          {/* 数据点 */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 96 + 2
            const yu = 90 - (d.users / maxVal) * 75
            const yp = 90 - (d.posts / maxVal) * 75
            return (
              <g key={i}>
                <circle cx={x} cy={yu} r="1.2" fill="#3b82f6" vectorEffect="non-scaling-stroke" />
                <circle cx={x} cy={yp} r="1.2" fill="#22c55e" vectorEffect="non-scaling-stroke" />
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
        {data.map(d => <span key={d.date}>{d.date}</span>)}
      </div>
    </div>
  )
}
