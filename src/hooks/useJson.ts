import { useEffect, useState } from 'react'

interface JsonState<T> {
  // null until it loads, and null for good if the request fails or the body
  // isn't JSON (e.g. a poller hasn't run yet, or CloudFront served the SPA
  // fallback instead of the real file).
  data: T | null
  loading: boolean
}

// Fetches a JSON file once on mount.
export function useJson<T>(url: string): JsonState<T> {
  const [state, setState] = useState<JsonState<T>>({ data: null, loading: true })

  useEffect(() => {
    let cancelled = false

    fetch(url)
      .then((res) => res.json())
      .then(
        (data: T) => {
          if (!cancelled) setState({ data, loading: false })
        },
        () => {
          if (!cancelled) setState({ data: null, loading: false })
        },
      )

    return () => {
      cancelled = true
    }
  }, [url])

  return state
}
