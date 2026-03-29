import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Modal from '../components/Modal'

const TYPES = ['alambre', 'cuenta', 'broche', 'cadena', 'componente', 'otro']
const UNITS = ['piezas', 'metros', 'cm', 'gramos', 'mm']
const GAUGES = [12, 14, 16, 18, 20, 22, 24, 26, 28]

const emptyForm = { name: '', type: 'cuenta', unit: 'piezas', cost_per_unit: '', stock_quantity: '', gauge: '', size: '', size_unit: 'mm' }

function MaterialCard({ m, onEdit, onDelete }) {
  const isWire = m.type === 'alambre'
  const isCm = m.unit === 'cm'
  const costPerM = isCm && m.cost_per_unit ? (m.cost_per_unit * 100).toFixed(4) : null

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-800">{m.name}</div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className="text-xs text-gray-400 capitalize">{m.type} · {m.unit}</span>
            {isWire && m.gauge && (
              <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                GA {m.gauge}
              </span>
            )}
            {m.size && (
              <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                {m.size % 1 === 0 ? m.size : m.size}{m.size_unit ?? 'mm'}
              </span>
            )}
          </div>
        </div>
        <div className="text-right ml-3 shrink-0">
          <div className="text-sm font-semibold text-gray-800">
            ${parseFloat(m.cost_per_unit).toFixed(4)}
            <span className="text-gray-400 font-normal">/{m.unit}</span>
          </div>
          {costPerM && (
            <div className="text-xs text-rose-400">${costPerM}/metro</div>
          )}
          <div className={`text-xs mt-0.5 font-medium ${parseFloat(m.stock_quantity) < 5 ? 'text-orange-500' : 'text-green-500'}`}>
            {m.stock_quantity} {m.unit}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => onEdit(m)}
          className="flex-1 text-xs text-rose-500 border border-rose-200 rounded-lg py-1.5 hover:bg-rose-50 transition-colors">
          Editar
        </button>
        <button onClick={() => onDelete(m.id)}
          className="flex-1 text-xs text-gray-400 border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 transition-colors">
          Eliminar
        </button>
      </div>
    </div>
  )
}

export default function Stock() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('todos')

  useEffect(() => { fetchMaterials() }, [])

  async function fetchMaterials() {
    const { data } = await supabase.from('materials').select('*').order('name')
    setMaterials(data ?? [])
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(m) {
    setEditing(m.id)
    setForm({
      name: m.name,
      type: m.type,
      unit: m.unit,
      cost_per_unit: m.cost_per_unit,
      stock_quantity: m.stock_quantity,
      gauge: m.gauge ?? '',
      size: m.size ?? '',
      size_unit: m.size_unit ?? 'mm'
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      type: form.type,
      unit: form.unit,
      cost_per_unit: parseFloat(form.cost_per_unit) || 0,
      stock_quantity: parseFloat(form.stock_quantity) || 0,
      gauge: form.type === 'alambre' && form.gauge ? parseInt(form.gauge) : null,
      size: form.size ? parseFloat(form.size) : null,
      size_unit: form.size ? (form.size_unit || 'mm') : null,
      updated_at: new Date().toISOString()
    }
    if (editing) {
      await supabase.from('materials').update(payload).eq('id', editing)
    } else {
      await supabase.from('materials').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    fetchMaterials()
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este material? También se quitará de los diseños que lo usen.')) return
    await supabase.from('materials').delete().eq('id', id)
    fetchMaterials()
  }

  const filtered = materials.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'todos' || m.type === filterType
    return matchSearch && matchType
  })

  const isWireForm = form.type === 'alambre'

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800">Stock</h1>
        <button onClick={openAdd}
          className="bg-rose-500 text-white rounded-xl px-4 py-2 text-sm font-medium">
          + Agregar
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar materiales..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-rose-200"
      />

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
          <div className="text-4xl mb-2">🧵</div>
          <p className="text-sm">
            {search || filterType !== 'todos' ? 'No hay materiales con ese filtro.' : '¡Aún no hay materiales. Agrega el primero!'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <MaterialCard key={m.id} m={m} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar material' : 'Nuevo material'}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Nombre *</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              placeholder="Ej: Hilo dorado 0.4mm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Tipo</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, gauge: '' })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 bg-white">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Unidad</label>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 bg-white">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Gauge — only for alambre */}
          {isWireForm && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Calibre</label>
              <div className="flex gap-2 flex-wrap">
                {GAUGES.map(g => (
                  <button key={g} type="button"
                    onClick={() => setForm({ ...form, gauge: form.gauge === g ? '' : g })}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      form.gauge === g
                        ? 'bg-amber-400 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-amber-100'
                    }`}>
                    GA {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tamaño — opcional para todos los tipos */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Tamaño (opcional)</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.size}
                onChange={e => setForm({ ...form, size: e.target.value })}
                placeholder="Ej: 5"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
                {['mm', 'cm'].map(u => (
                  <button key={u} type="button"
                    onClick={() => setForm({ ...form, size_unit: u })}
                    className={`px-4 py-2.5 font-medium transition-colors ${
                      form.size_unit === u ? 'bg-rose-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Costo por {form.unit} ($)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={form.cost_per_unit}
                onChange={e => setForm({ ...form, cost_per_unit: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                placeholder="0.0000"
              />
              {/* Show price/metro preview for cm */}
              {form.unit === 'cm' && form.cost_per_unit > 0 && (
                <div className="text-xs text-rose-400 mt-1">
                  = ${(parseFloat(form.cost_per_unit) * 100).toFixed(4)}/metro
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Cantidad</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.stock_quantity}
                onChange={e => setForm({ ...form, stock_quantity: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                placeholder="0"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="w-full bg-rose-500 text-white rounded-xl py-3 font-medium text-sm hover:bg-rose-600 disabled:opacity-50 transition-colors">
            {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Agregar material'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
