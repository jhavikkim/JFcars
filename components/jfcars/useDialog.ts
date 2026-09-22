'use client';

import { useEffect, useEffectEvent } from 'react';

export function useDialog(close: () => void) {
  const closeDialog = useEffectEvent(close);

  useEffect(() => {
    const previous = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    const dialogs = Array.from(
      document.querySelectorAll<HTMLDialogElement>('dialog[open]'),
    );
    const dialog = dialogs.at(-1);
    dialog?.setAttribute('aria-modal', 'true');
    if (dialog && !dialog.hasAttribute('tabindex'))
      dialog.setAttribute('tabindex', '-1');
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusTimer = window.setTimeout(() => {
      const first = dialog?.querySelector<HTMLElement>(focusableSelector);
      (first || dialog)?.focus();
    }, 0);
    const onKeyDown = (event: KeyboardEvent) => {
      const topDialog = Array.from(
        document.querySelectorAll<HTMLDialogElement>('dialog[open]'),
      ).at(-1);
      if (!dialog || topDialog !== dialog) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDialog();
      }
      if (event.key === 'Tab' && dialog) {
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(focusableSelector),
        ).filter((element) => element.offsetParent !== null);
        if (!focusable.length) {
          event.preventDefault();
          dialog.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable.at(-1)!;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused && document.contains(previouslyFocused))
        previouslyFocused.focus();
    };
  }, []);
}
