"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Whether the desktop chat window is currently docked open, squeezing the
 * page into the remaining width. Navbar (and anything else with a fixed-width
 * desktop row that needs to fit in less room) reads this to compact its
 * spacing only while the squeeze is actually active — rather than guessing at
 * viewport-width breakpoints, which broke on 1080p screens: a flat 420px
 * squeeze left plenty of room on a 2K monitor but not enough on 1920px-wide
 * ones, cutting off the cart/account icons and the Build Yours button.
 */
const ChatSqueezeContext = createContext<boolean>(false);

export function ChatSqueezeProvider({ isSqueezed, children }: { isSqueezed: boolean; children: ReactNode }) {
  return <ChatSqueezeContext.Provider value={isSqueezed}>{children}</ChatSqueezeContext.Provider>;
}

export function useChatSqueeze(): boolean {
  return useContext(ChatSqueezeContext);
}
