import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { Toaster } from 'sileo'
import { configureApiAuth } from '@/api/client'
import { Workspace } from '@/components/layout/Workspace'
import { TooltipProvider } from '@/components/ui/tooltip'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useAuthStore } from '@/features/auth/store'
import { queryClient } from '@/lib/query-client'

// Se registra antes del primer render para que ninguna petición salga sin token.
configureApiAuth({
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => {
    queryClient.clear()
    useAuthStore.getState().logout()
  },
})

export default function App() {
  // Una sesión nueva no debe ver datos en caché de la anterior.
  useEffect(() => useAuthStore.subscribe((s, prev) => {
    if (prev.token && !s.token) queryClient.clear()
  }), [])

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Workspace />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      <Toaster position="top-right" theme="system" />
    </QueryClientProvider>
  )
}
