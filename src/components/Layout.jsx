import { useAuth } from '../contexts/AuthContext'
import BottomNav from './BottomNav'

export default function Layout({ children }) {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">💍</span>
          <span className="font-bold text-gray-800 text-sm">Dreams Design</span>
        </div>
        <button onClick={signOut} className="text-xs text-gray-400 hover:text-gray-600">
          Sign out
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
