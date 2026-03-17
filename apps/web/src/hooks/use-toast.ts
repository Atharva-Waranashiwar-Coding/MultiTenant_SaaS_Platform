'use client';

import * as React from 'react';
import type { ToastProps } from '@/components/ui/toast';

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 4000;

type ToastInput = Pick<ToastProps, 'variant'> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
};

type ToastItem = ToastInput & { id: string; open: boolean };

type Action =
  | { type: 'ADD_TOAST'; toast: ToastItem }
  | { type: 'DISMISS_TOAST'; id: string }
  | { type: 'REMOVE_TOAST'; id: string };

interface State {
  toasts: ToastItem[];
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_TOAST':
      return { toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case 'DISMISS_TOAST':
      return { toasts: state.toasts.map((t) => (t.id === action.id ? { ...t, open: false } : t)) };
    case 'REMOVE_TOAST':
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
  }
}

// ── Singleton store ────────────────────────────────────────────
let count = 0;
const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

function toast(input: ToastInput) {
  const id = `toast-${++count}`;
  dispatch({ type: 'ADD_TOAST', toast: { ...input, id, open: true } });

  setTimeout(() => {
    dispatch({ type: 'DISMISS_TOAST', id });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 300);
  }, TOAST_REMOVE_DELAY);

  return id;
}

toast.success = (title: string, description?: string) =>
  toast({ title, description, variant: 'success' });

toast.error = (title: string, description?: string) =>
  toast({ title, description, variant: 'destructive' });

// ── Hook ──────────────────────────────────────────────────────
function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const idx = listeners.indexOf(setState);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  return {
    toasts: state.toasts,
    toast,
    dismiss: (id: string) => dispatch({ type: 'DISMISS_TOAST', id }),
  };
}

export { useToast, toast };
