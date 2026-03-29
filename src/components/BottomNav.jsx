import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Inicio', icon: '📊' },
  { to: '/stock', label: 'Stock', icon: '🧵' },
  { to: '/designs', label: 'Diseños', icon: '💍' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex max-w-md mx-auto z-10">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2.5 text-xs transition-colors ${
              isActive ? 'text-rose-500' : 'text-gray-400'
            }`
          }
        >
          <span className="text-lg">{tab.icon}</span>
          <span className="mt-0.5 font-medium">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
