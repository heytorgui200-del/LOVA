import { useEffect, useRef, useCallback } from "react";

/**
 * Smart polling hook with:
 * - Progressive backoff (5s → 10s → 15s → 20s, capped at 20s)
 * - Pauses when browser tab is hidden
 * - Stops on terminal condition
 */
export function useSmartPolling(
  callback: () => Promise<void>,
  options: {
    enabled: boolean;
    initialInterval?: number;
    maxInterval?: number;
    backoffStep?: number;
  },
) {
  const {
    enabled,
    initialInterval = 5000,
    maxInterval = 20000,
    backoffStep = 5000,
  } = options;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef(initialInterval);
  const visibleRef = useRef(!document.hidden);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const schedule = useCallback(() => {
    clear();
    if (!visibleRef.current) return;
    timerRef.current = setTimeout(async () => {
      await callbackRef.current();
      // Increase interval (backoff)
      intervalRef.current = Math.min(intervalRef.current + backoffStep, maxInterval);
      schedule();
    }, intervalRef.current);
  }, [clear, backoffStep, maxInterval]);

  useEffect(() => {
    if (!enabled) {
      clear();
      return;
    }

    // Reset interval on enable
    intervalRef.current = initialInterval;

    // Run immediately, then schedule
    callbackRef.current().then(() => schedule());

    const onVisChange = () => {
      visibleRef.current = !document.hidden;
      if (visibleRef.current) {
        // Tab became visible — poll immediately and resume
        intervalRef.current = initialInterval;
        callbackRef.current().then(() => schedule());
      } else {
        clear();
      }
    };

    document.addEventListener("visibilitychange", onVisChange);

    return () => {
      clear();
      document.removeEventListener("visibilitychange", onVisChange);
    };
  }, [enabled, initialInterval, clear, schedule]);

  return { stop: clear };
}
