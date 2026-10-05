import { useEffect, useState } from 'react'

// Fetches a JSON file once on mount; null until it loads, and null for good if
// the request fails or the body isn't JSON (e.g. a poller hasn't run yet, or
// CloudFront served the SPA fallback instead of the real file).
export function useJson<T>(url: string) {
  const [data, setData] = useState<T | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch(url)
      .then((res) => res.json())
      .then((body: T) => {
        if (!cancelled) setData(body)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [url])

  return data
}
