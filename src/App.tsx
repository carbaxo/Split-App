import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './components/Login'
import Dashboard from './pages/Dashboard'
import Friends from './pages/Friends'
import Activity from './pages/Activity'
import Account from './pages/Account'
import CreateGroup from './pages/CreateGroup'
import JoinGroup from './pages/JoinGroup'
import GroupDetail from './pages/GroupDetail'
import AddExpense from './pages/AddExpense'
import SettleUp from './pages/SettleUp'

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <div className="flex min-h-full items-center justify-center text-gray-400">
        <p>Cargando…</p>
      </div>
    )
  if (!user) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/friends" element={<Protected><Friends /></Protected>} />
      <Route path="/activity" element={<Protected><Activity /></Protected>} />
      <Route path="/account" element={<Protected><Account /></Protected>} />
      <Route path="/new-group" element={<Protected><CreateGroup /></Protected>} />
      <Route path="/join" element={<Protected><JoinGroup /></Protected>} />
      <Route path="/join/:code" element={<Protected><JoinGroup /></Protected>} />
      <Route path="/group/:id" element={<Protected><GroupDetail /></Protected>} />
      <Route path="/group/:id/add" element={<Protected><AddExpense /></Protected>} />
      <Route path="/group/:id/expense/:eid" element={<Protected><AddExpense /></Protected>} />
      <Route path="/group/:id/settle" element={<Protected><SettleUp /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
