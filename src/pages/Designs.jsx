import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const TYPES = ['pulsera', 'collar', 'anillo', 'aretes', 'otro']

function calcCost(design) {
  const matCost = design.design_materials?.reduce((sum, dm) => {
    return sum + (dm.quantity * (dm.materials?.cost_per_unit ?? 0))
  }, 0) ?? 0
  return matCost + (design.labor_cost ?? 0)
}

export default function Designs() {
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('todos')
  const navigate = useNavigate()

  useEffect(() => { fetchDesigns() }, [])

  async function fetchDesigns() {
    const { data } = await supabase
      .from('designs')
      .select('*, design_materials(quantity, materials(cost_per_unit, name, unit))')
      .order('created_at', { ascending: false })
    setDesigns(data ?? [])
    setLoading(false)
  }

  const filtered = filterType === 'todos' ? designs : designs.filter(d => d.type === filterType)

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800">Diseños</h1>
        <button onClick={() => navigate('/designs/new')}
          className="bg-rose-500 text-white rounded-xl px-4 py-2 text-sm font-medium">
          + Nuevo
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {['todos', ...TYPES].map(t => (
          <button key={t}
            onClick={() => setFilterType(t)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
              filterType === t ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          <div className="text-4xl mb-2">💍</div>
          <p className="text-sm">
            {filterType !== 'todos' ? 'Aún no hay diseños de este tipo.' : '¡Aún no hay diseños. Crea el primero!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => {
            const cost = calcCost(d)
            const matCost = cost - (d.labor_cost ?? 0)
            const profit = d.sale_price != null ? d.sale_price - cost : null
            const margin = d.sale_price != null && d.sale_price > 0
              ? ((profit / d.sale_price) * 100).toFixed(0)
              : null

            return (
              <div key={d.id}
                onClick={() => navigate(`/designs/${d.id}`)}
                className="bg-white border border-gray-100 rounded-2xl p-4 cursor-pointer active:scale-[0.99] transition-all hover:border-rose-200">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-gray-800">{d.name}</div>
                    <div className="text-xs text-gray-400 capitalize mt-0.5">{d.type}</div>
                  </div>
                  <div className="text-right">
                    {d.sale_price != null ? (
                      <>
                        <div className="font-bold text-gray-800">€{parseFloat(d.sale_price).toFixed(2)}</div>
                        {margin != null && (
                          <div className={`text-xs font-medium ${parseFloat(margin) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {margin}% margen
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-gray-300">Sin precio</div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-50 flex gap-4 flex-wrap">
                  <div>
                    <div className="text-xs text-gray-400">Materiales</div>
                    <div className="text-sm font-medium text-gray-700">€{matCost.toFixed(2)}</div>
                  </div>
                  {(d.labor_cost ?? 0) > 0 && (
                    <div>
                      <div className="text-xs text-gray-400">Mano de obra</div>
                      <div className="text-sm font-medium text-gray-700">€{parseFloat(d.labor_cost).toFixed(2)}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-gray-400">Costo total</div>
                    <div className="text-sm font-medium text-gray-700">€{cost.toFixed(2)}</div>
                  </div>
                  {profit != null && (
                    <div>
                      <div className="text-xs text-gray-400">Ganancia</div>
                      <div className={`text-sm font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        €{profit.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                {(d.design_materials?.length ?? 0) > 0 && (
                  <div className="mt-2 text-xs text-gray-400">
                    {d.design_materials.length} {d.design_materials.length !== 1 ? 'materiales' : 'material'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
