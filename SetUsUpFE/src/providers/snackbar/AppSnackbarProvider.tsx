import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Alert, Slide, Snackbar, type AlertColor, type SlideProps } from '@mui/material';


export interface SnackbarMessage {
  severity: AlertColor; // 'success' | 'info' | 'warning' | 'error'
  message: string;
  durationMs?: number;  // optional autoHideDuration override
}

interface AppSnackbarContextValue {
  enqueue: (msg: SnackbarMessage) => void; // enqueue a snackbar message; multiple in a row queue up cleanly
  success: (message: string, durationMs?: number) => void;
  info:    (message: string, durationMs?: number) => void;
  warning: (message: string, durationMs?: number) => void;
  error:   (message: string, durationMs?: number) => void;
}

const AppSnackbarContext = createContext<AppSnackbarContextValue | null>(null);


/* slide-up transition for snackbar entries */
function SlideUp(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}


export default function AppSnackbarProvider({ children }: { children: React.ReactNode }) {
  /* queue of pending messages and currently displayed one */
  const queueRef = useRef<SnackbarMessage[]>([]);
  const [current, setCurrent] = useState<SnackbarMessage | null>(null);
  const [open, setOpen] = useState(false);

  /* picks the next message off the queue (if any) and shows it */
  const promoteNext = useCallback(() => {
    const next = queueRef.current.shift() ?? null;
    setCurrent(next);
    setOpen(next !== null);
  }, []);

  const enqueue = useCallback((msg: SnackbarMessage) => {
    if (current === null && !open) {
      /* no active snackbar - show immediately */
      setCurrent(msg);
      setOpen(true);
    } else {
      /* push to the queue, it will be promoted after the current one closes */
      queueRef.current.push(msg);
    }
  }, [current, open]);

  /* handler for closing the snackbar (auto-hide or user-dismissed) */
  const handleClose = useCallback((_ev?: unknown, reason?: string) => {
    if (reason === 'clickaway')
      return; // ignore accidental click-aways: user must press X or wait for autohide
    setOpen(false);
  }, []);

  /* once the transition is done we can promote the next queued message */
  const handleExited = useCallback(() => {
    setCurrent(null);
    promoteNext();
  }, [promoteNext]);


  const ctxValue = useMemo<AppSnackbarContextValue>(() => ({
    enqueue,
    success: (message, durationMs) => enqueue({ severity: 'success', message, durationMs }),
    info:    (message, durationMs) => enqueue({ severity: 'info',    message, durationMs }),
    warning: (message, durationMs) => enqueue({ severity: 'warning', message, durationMs }),
    error:   (message, durationMs) => enqueue({ severity: 'error',   message, durationMs }),
  }), [enqueue]);


  return (
    <AppSnackbarContext.Provider value={ctxValue}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={current?.durationMs ?? 4500}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slots={{ transition: SlideUp }}
        slotProps={{
          transition: { onExited: handleExited }
        }}
        sx={{ pointerEvents: 'auto' }}
      >
        {current ? (
          <Alert
            variant="filled"
            severity={current.severity}
            onClose={handleClose}
            sx={{
              borderRadius: 3,
              minWidth: 320,
              maxWidth: 540,
              boxShadow: 6,
              alignItems: 'center'
            }}
          >
            {current.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </AppSnackbarContext.Provider>
  );
}


/* hook used by any consumer component to enqueue snackbars */
export function useAppSnackbar(): AppSnackbarContextValue {
  const ctx = useContext(AppSnackbarContext);
  if (!ctx)
    throw new Error('useAppSnackbar must be used inside an <AppSnackbarProvider>.');
  return ctx;
}
