import { useCallback, useEffect, useRef, useState } from 'react'
import { apiGet } from '../lib/api'
import { getErrorMessage } from '../utils/errorMessage'

type Paged = { page?: number; pages?: number; total?: number }

export type InfiniteResourceState<Item, Data extends Paged> = {
  data: Data | null
  error: string
  items: Item[]
  loadMore: () => void
  loadMoreError: string
  loading: boolean
  loadingMore: boolean
  refetch: () => Promise<void>
  refreshing: boolean
  total: number
}

/**
 * Page-cursor list loader used by the endless feeds (`/recommendations/feed`, `/community/gallery`,
 * `/chat/:id`). `buildPath(page)` keeps query building at the call site; `deps` resets to page 1
 * whenever the filters behind that path change.
 */
export function useInfiniteApiResource<Item, Data extends Paged>(
  buildPath: (page: number) => string | null,
  extract: (data: Data) => Item[],
  deps: unknown[] = [],
): InfiniteResourceState<Item, Data> {
  const [data, setData] = useState<Data | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState('')
  const [loadMoreError, setLoadMoreError] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const pageRef = useRef(1)
  const requestRef = useRef(0)
  const depsKey = JSON.stringify(deps)

  const load = useCallback(
    async (page: number, mode: 'append' | 'refresh' | 'replace') => {
      const path = buildPath(page)
      if (!path) return

      requestRef.current += 1
      const requestId = requestRef.current
      if (mode === 'append') setLoadingMore(true)
      if (mode === 'refresh') setRefreshing(true)
      if (mode === 'replace') setLoading(true)
      setLoadMoreError('')
      if (mode !== 'append') setError('')

      try {
        const result = await apiGet<Data>(path)
        if (requestRef.current !== requestId) return
        const nextItems = extract(result)
        pageRef.current = page
        setData(result)
        setItems((current) => {
          if (mode === 'append') {
            const seen = new Set(current.map((item) => (item as { _id?: string })._id))
            return [...current, ...nextItems.filter((item) => !seen.has((item as { _id?: string })._id))]
          }
          return nextItems
        })
      } catch (requestError) {
        if (requestRef.current !== requestId) return
        const message = getErrorMessage(requestError, 'Unable to load results')
        if (mode === 'append') setLoadMoreError(message)
        else setError(message)
      } finally {
        if (requestRef.current !== requestId) return
        setLoading(false)
        setLoadingMore(false)
        setRefreshing(false)
      }
    },
    // `buildPath`/`extract` are recreated per render at most call sites; `depsKey` is the real identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [depsKey],
  )

  useEffect(() => {
    pageRef.current = 1
    // Deferred so the effect never sets state synchronously and cascades a second render pass.
    queueMicrotask(() => {
      setItems([])
      void load(1, 'replace')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey])

  const loadMore = useCallback(() => {
    if (loading || loadingMore || refreshing) return
    const pages = data?.pages ?? 1
    if (pageRef.current >= pages) return
    void load(pageRef.current + 1, 'append')
  }, [data?.pages, load, loading, loadingMore, refreshing])

  const refetch = useCallback(async () => {
    pageRef.current = 1
    await load(1, 'refresh')
  }, [load])

  return {
    data,
    error,
    items,
    loadMore,
    loadMoreError,
    loading,
    loadingMore,
    refetch,
    refreshing,
    total: data?.total ?? items.length,
  }
}
