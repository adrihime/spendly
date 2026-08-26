import './App.css'
import { Route, Routes } from 'react-router-dom'
import { SummaryPage } from './routes/SummaryPage'
import { NavBar } from './shared/lib/NavBar'
import { DotGridBackground } from './shared/lib/DotGridBackground'
import { Toaster } from './components/ui/toast'
import { LoginScreen } from './features/auth/LoginScreen'
import { useAuth } from './features/auth/useAuth'

function App() {
  const { user, isPending, login, logout } = useAuth()

  return (
    <div className="isolate p-4 min-h-screen flex flex-col md:h-screen md:overflow-hidden">
      <DotGridBackground />
      <NavBar user={user} isPending={isPending} onLogout={() => logout.mutate()} />
      {isPending ? (
        <div className="flex flex-1 items-center justify-center text-zinc-400">Carregando...</div>
      ) : user ? (
        <Routes>
          <Route path="/" element={<SummaryPage />} />
        </Routes>
      ) : (
        <LoginScreen onSuccess={(credential) => login.mutate(credential)} />
      )}
      <Toaster />
    </div>
  )
}

export default App
