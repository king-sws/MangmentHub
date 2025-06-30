// components/providers/dashboard-theme-provider.tsx
"use client"
import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function DashboardThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider 
      {...props}
      storageKey="dashboard-theme" // Different storage key
      defaultTheme="system"
      enableSystem={true}
      themes={["light", "dark", "system"]}
    >
      {children}
    </NextThemesProvider>
  )
}