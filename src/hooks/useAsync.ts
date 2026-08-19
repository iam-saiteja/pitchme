import { useCallback, useEffect, useRef, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: unknown;
  reload: () => void;
  setData: (next: T) => void;
}

/** Minimal fetch-on-mount helper with a stable reload handle. */
export function useAsync<T>(factory: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [nonce, setNonce] = useState(0);
  const latest = useRef(0);

  const run = useCallback(factory, deps);

  useEffect(() => {
    const ticket = ++latest.current;
    let alive = true;
    setLoading(true);
    setError(null);

    run()
      .then((result) => {
        if (!alive || ticket !== latest.current) return;
        setData(result);
      })
      .catch((err) => {
        if (!alive || ticket !== latest.current) return;
        setError(err);
      })
      .finally(() => {
        if (!alive || ticket !== latest.current) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [run, nonce]);

  return {
    data,
    loading,
    error,
    reload: () => setNonce((n) => n + 1),
    setData: (next: T) => setData(next),
  };
}
