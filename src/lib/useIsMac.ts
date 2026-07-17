"use client";

import { useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};

/** true en macOS/iOS (⌘ como modificador); true también en SSR para no parpadear. */
export function useIsMac(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => /Mac|iP/.test(navigator.platform),
    () => true,
  );
}
