import { useState, useEffect, useCallback } from 'react'

// Small data-fetch hook exposing loading / error / data / reload for consistent states.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null })

  const run = useCallback(() => {
    let alive = true
    setState({ loading: true, error: null, data: null })
    fn()
      .then((data) => alive && setState({ loading: false, error: null, data }))
      .catch((err) => alive && setState({ loading: false, error: err.message || 'Error', data: null }))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(run, [run])
  return { ...state, reload: run }
}
