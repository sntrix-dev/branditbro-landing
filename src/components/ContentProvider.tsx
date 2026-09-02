"use client";

import { createContext, useContext } from "react";
import { resolveContent, type Content, type ResolvedContent } from "@/content/schema";

const ContentContext = createContext<ResolvedContent | null>(null);

export function ContentProvider({ content, children }: { content: Content; children: React.ReactNode }) {
  return <ContentContext.Provider value={resolveContent(content)}>{children}</ContentContext.Provider>;
}

export function useContent(): ResolvedContent {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within <ContentProvider>");
  return ctx;
}
