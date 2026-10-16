import { createContext, useContext, useState, useCallback, useRef } from "react";
import Toast from "./components/Toast.jsx";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
