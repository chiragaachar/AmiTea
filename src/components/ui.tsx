"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Check, AlertCircle, LoaderCircle } from "lucide-react";
import { createContext, useContext, useState, useRef, useEffect } from "react";
const ToastContext = createContext<(message: string, ok?: boolean) => void>(
  () => {},
);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(
    null,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function notify(message: string, ok = true) {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, ok });
    timer.current = setTimeout(() => setToast(null), 7000);
  }
  return (
    <ToastContext value={notify}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className={`toast ${toast.ok ? "" : "failure"}`}>
            {toast.ok ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{toast.message}</span>
            <button
              className="icon-button"
              aria-label="Dismiss notification"
              onClick={() => setToast(null)}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </ToastContext>
  );
}
export const useToast = () => useContext(ToastContext);
export function Modal({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal">
          <div className="modal-heading">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="Close dialog">
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Submit({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button className="button primary" type="submit" disabled={pending}>
      {pending ? (
        <>
          <LoaderCircle size={17} className="spin" /> Saving…
        </>
      ) : (
        children
      )}
    </button>
  );
}
