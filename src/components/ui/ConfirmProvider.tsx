import { createContext, useContext, useCallback, useState, useRef } from 'react';
import { ConfirmDialog } from './ConfirmDialog';

type Variant = 'danger' | 'primary' | 'warning' | 'info';

interface Options {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  icon?: React.ReactNode;
}

type ConfirmFn = (opts: Options) => Promise<boolean>;

const Ctx = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<(Options & { open: boolean }) | null>(null);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({ ...opts, variant: opts.variant ?? 'danger', open: true });
    });
  }, []);

  const close = useCallback(
    (result: boolean) => {
      setState((s) => (s ? { ...s, open: false } : null));
      // small delay to let exit animation play before resolving & unmounting
      setTimeout(() => {
        resolverRef.current?.(result);
        resolverRef.current = null;
        setState(null);
      }, 180);
    },
    [],
  );

  return (
    <Ctx.Provider value={confirm}>
      {children}
      {state && (
        <ConfirmDialog
          open={state.open}
          title={state.title}
          description={state.description}
          confirmLabel={state.confirmLabel}
          cancelLabel={state.cancelLabel}
          variant={state.variant}
          icon={state.icon}
          onConfirm={() => close(true)}
          onCancel={() => close(false)}
        />
      )}
    </Ctx.Provider>
  );
}
