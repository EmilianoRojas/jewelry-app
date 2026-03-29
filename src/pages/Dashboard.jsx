import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

function calcCost(design) {
  const matCost = design.design_materials?.reduce((sum, dm) => {
    return sum + (dm.quantity * (dm.materials?.cost_per_unit ?? 0))
  }, 0) ?? 0
  return matCost + (design.labor_cost ?? 0)
}

export default function Dashboard() {
  const [stats, setStats] = useState({ materials: 0, designs: 0, lowStock: [] })
  const [recentDesigns, setRecentDesigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    try {
      const [materialsRes, designsRes, lowStockRes, recentRes] = await Promise.all([
        supabase.from('materials').select('id', { count: 'exact', head: true }),
        supabase.from('designs').select('id', { count: 'exact', head: true }),
        supabase.from('materials').select('*').lt('stock_quantity', 5).order('stock_quantity'),
        supabase
          .from('designs')
          .select('*, design_materials(quantity, materials(cost_per_unit))')
          .order('created_at', { ascending: false })
          .limit(3)
      ])
      setStats({
        materials: materialsRes.count ?? 0,
        designs: designsRes.count ?? 0,
        lowStock: lowStockRes.data ?? []
      })
      setRecentDesigns(recentRes.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-6 text-center text-gray-400 py-16">Cargando...</div>

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Resumen</h1>
        <p className="text-sm text-gray-400 mt-0.5">Tu joyería de un vistazo</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-rose-50 rounded-2xl p-4">
          <div className="text-3xl font-bold text-rose-600">{stats.materials}</div>
          <div className="text-xs text-rose-400 mt-1">Materiales en stock</div>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4">
          <div className="text-3xl font-bold text-amber-600">{stats.designs}</div>
          <div className="text-xs text-amber-400 mt-1">Diseños creados</div>
        </div>
      </div>

      {/* Low stock alerts */}
      {stats.lowStock.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">⚠️ Stock bajo</h2>
          <div className="space-y-2">
            {stats.lowStock.map(m => (
              <div key={m.id}
                className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{m.name}</span>
                <span className="text-xs text-orange-500 font-medium">
                  {m.stock_quantity} {m.unit} restantes
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent designs */}
      {recentDesigns.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-gray-700">Diseños recientes</h2>
            <Link to="/designs" className="text-xs text-rose-500">Ver todos →</Link>
          </div>
          <div className="space-y-2">
            {recentDesigns.map(d => {
              const cost = calcCost(d)
              const profit = d.sale_price != null ? d.sale_price - cost : null
              const margin = d.sale_price && d.sale_price > 0
                ? ((profit / d.sale_price) * 100).toFixed(0)
                : null
              return (
                <Link to={`/designs/${d.id}`} key={d.id}
                  className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex justify-between items-center block hover:border-rose-200 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{d.name}</div>
                    <div className="text-xs text-gray-400 capitalize">{d.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-800">
                      {d.sale_price != null ? `€${parseFloat(d.sale_price).toFixed(2)}` : '—'}
                    </div>
                    {margin != null && (
                      <div className={`text-xs ${parseFloat(margin) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {margin}% margen
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {stats.materials === 0 && stats.designs === 0 && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-3">✨</div>
          <p className="text-sm font-medium">¡Bienvenida a tu estudio!</p>
          <p className="text-xs mt-1">Empieza agregando materiales a tu stock.</p>
        </div>
      )}
    </div>
  )
}
