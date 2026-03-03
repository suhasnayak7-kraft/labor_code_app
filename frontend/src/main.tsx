import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from './components/ui/sonner'
import { validateEnvironment } from './lib/validate-env'
import { AuthProvider } from './hooks/useAuth'

validateEnvironment();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <Toaster richColors position="top-center" />
    </AuthProvider>
  </StrictMode>,
)
