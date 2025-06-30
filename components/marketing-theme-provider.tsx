// components/providers/marketing-theme-provider.tsx
"use client"
import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function MarketingThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider 
      {...props}
      storageKey="marketing-theme" // Different storage key
      defaultTheme="light" // Force light theme for marketing
      enableSystem={false} // Disable system theme detection
      themes={["light"]} // Only allow light theme
    >
      {children}
    </NextThemesProvider>
  )
}