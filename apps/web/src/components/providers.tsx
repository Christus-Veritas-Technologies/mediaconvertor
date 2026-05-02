"use client";

import { Toaster } from "@MediaConvertor/ui/components/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors />
    </>
  );
}
