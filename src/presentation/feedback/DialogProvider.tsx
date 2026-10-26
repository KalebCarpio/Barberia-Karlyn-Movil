import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { DialogVariant, FeedbackDialog } from '../components/FeedbackDialog';
import { ActionResult, ResultDetail } from '../viewmodels/types';

type DialogOptions = {
  variant: DialogVariant;
  title: string;
  message: string;
  details?: ResultDetail[];
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type DialogApi = {
  // Muestra el resultado de una accion del ViewModel (exito o error).
  notify: (result: ActionResult) => Promise<void>;
  // Pide confirmacion; resuelve true si el usuario acepta.
  confirm: (options: Omit<DialogOptions, 'variant'>) => Promise<boolean>;
  info: (title: string, message: string) => Promise<void>;
};

const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<DialogOptions>({ variant: 'info', title: '', message: '' });
  const [visible, setVisible] = useState(false);
  const resolver = useRef<((accepted: boolean) => void) | null>(null);

  const open = useCallback((next: DialogOptions) => new Promise<boolean>((resolve) => {
    resolver.current?.(false);
    resolver.current = resolve;
    setOptions(next);
    setVisible(true);
  }), []);

  const close = (accepted: boolean) => {
    setVisible(false);
    resolver.current?.(accepted);
    resolver.current = null;
  };

  const api = useMemo<DialogApi>(() => ({
    notify: async (result) => {
      await open({ variant: result.ok ? 'success' : 'error', title: result.title, message: result.message, details: result.details });
    },
    confirm: (confirmOptions) => open({ variant: 'confirm', ...confirmOptions }),
    info: async (title, message) => {
      await open({ variant: 'info', title, message });
    },
  }), [open]);

  const defaultLabel = options.variant === 'error' ? 'Entendido' : options.variant === 'confirm' ? 'Aceptar' : 'Listo';

  return (
    <DialogContext.Provider value={api}>
      {children}
      <FeedbackDialog
        visible={visible}
        variant={options.variant}
        title={options.title}
        message={options.message}
        details={options.details}
        confirmLabel={options.confirmLabel || defaultLabel}
        cancelLabel={options.cancelLabel}
        destructive={options.destructive}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const api = useContext(DialogContext);
  if (!api) throw new Error('useDialog debe usarse dentro de DialogProvider');
  return api;
}
