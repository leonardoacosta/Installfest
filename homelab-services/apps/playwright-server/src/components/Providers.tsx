'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from '@homelab/ui'
import { TRPCProvider } from '@/trpc/Provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TRPCProvider>
        {children}
        <Toaster />
      </TRPCProvider>
    </ThemeProvider>
  )
}
