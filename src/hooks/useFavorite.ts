import { useCallback, useEffect, useState } from 'react'
import { apiDelete, apiGet, apiPost } from '../lib/api'
import { useAuth } from './useAuth'

type FavoriteTargetType = 'event' | 'listing'

/**
 * Favourite state is per-target and read on mount, matching `frontend`'s `FavoriteButton`.
 * The toggle is optimistic and rolls back if the write fails.
 */
export function useFavorite(targetType: FavoriteTargetType, targetId: string, initialActive?: boolean) {
  const { user } = useAuth()
  const [active, setActive] = useState(Boolean(initialActive))
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!user || !targetId || initialActive !== undefined) return
    let cancelled = false

    apiGet<{ active: boolean }>(`/favorites/status?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`)
      .then((data) => {
        if (!cancelled) setActive(Boolean(data.active))
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [initialActive, targetId, targetType, user])

  const toggle = useCallback(async () => {
    if (!user || pending || !targetId) return { requiresAuth: !user }
    const next = !active
    setActive(next)
    setPending(true)

    try {
      const path = `/favorites/${targetType}/${targetId}`
      if (next) await apiPost(path)
      else await apiDelete(path)
    } catch {
      setActive(!next)
    } finally {
      setPending(false)
    }

    return { requiresAuth: false }
  }, [active, pending, targetId, targetType, user])

  return { active, pending, toggle }
}
