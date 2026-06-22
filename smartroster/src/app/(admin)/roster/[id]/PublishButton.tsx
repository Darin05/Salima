'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { publishRoster } from '../actions'

export default function PublishButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function publish() {
    setLoading(true)
    await publishRoster(id)
    router.refresh()
  }

  return (
    <button onClick={publish} disabled={loading}
      className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60">
      {loading ? 'Publishing…' : '✓ Publish Roster'}
    </button>
  )
}
