import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { queryClient, persister, CACHE_VERSIE, CACHE_MAX_LEEFTIJD } from './queries/client.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Als PersistQueryClientProvider, niet als gewone QueryClientProvider:
        deze variant zet eerst de cache uit IndexedDB terug en rendert de app
        pas daarna. Zonder dat zie je bij een start zonder verbinding eerst een
        leeg scherm dat een tel later invult. */}
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: CACHE_MAX_LEEFTIJD,
        buster: CACHE_VERSIE,
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </PersistQueryClientProvider>
  </StrictMode>,
)
