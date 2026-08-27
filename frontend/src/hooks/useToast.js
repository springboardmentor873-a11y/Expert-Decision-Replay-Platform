import { useCallback, useState } from "react";

/**
 * Minimal per-page toast: shows a message for a few seconds then clears it.
 * Kept local (not global) since Milestone 1 only needs single, page-scoped
 * success/error confirmations after an action.
 */
export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, tone = "success") => {
    setToast({ message, tone });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 3500);
  }, []);

  return [toast, showToast];
}
