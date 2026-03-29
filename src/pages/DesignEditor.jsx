import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useParams } from 'react-router-dom'

const DESIGN_TYPES = ['pulsera', 'collar', 'anillo', 'aretes', 'otro']

export default function DesignEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [name, setName] = useState('')
  const [type, setType] = useState('pulsera')
  const [notes, setNotes] = useState('')
  const [laborCost, setLaborCost] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [designMaterials, setDesignMaterials] = useState([])
  const [allMaterials, setAllMaterials] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [selectedMaterialId, setSelectedMaterialId] = useState('')
  const [selectedQty, setSelectedQty] = useState('')

  useEffect(() => {
    fetchAllMaterials()
    if (!isNew) loadDesign()
  }, [id])

  async function fetchAllMaterials() {
    const { data } = await supabase.from('materials').select('*').order('name')
    setAllMaterials(data ?? [])
  }

  async function loadDesign() {
    const { data } = await supabase
      .from('designs')
      .select('*, design_materials(id, quantity, material_id, materials(*))')
      .eq('id', id)
      .single()

    if (data) {
      setName(data.name)
      setType(data.type)
      setNotes(data.notes ?? '')
      setLaborCost(data.labor_cost ?? '')
      setSalePrice(data.sale_price ?? '')
      setDesignMaterials(data.design_materials.map(dm => ({
        id: dm.id,
        material_id: dm.material_id,
        quantity: dm.quantity,
        material: dm.materials
      })))
    }
    setLoading(false)
  }

  function addMaterial() {
    if (!selectedMaterialId || !selectedQty) return
    const material = allMaterials.find(m => m.id === selectedMaterialId)
    if (!material) return
    if (designMaterials.find(dm => dm.material_id === selectedMaterialId)) return
    setDesignMaterials([...designMaterials, {
      material_id: selectedMaterialId,
      quantity: parseFloat(selectedQty) || 0,
      material
    }])
    setSelectedMaterialId('')
    setSelectedQty('')
    setShowAddMaterial(false)
  }

  function removeMaterial(material_id) {
    setDesignMaterials(designMaterials.filter(dm => dm.material_id !== material_id))
  }

  function updateQty(material_id, qty) {
    setDesignMaterials(designMaterials.map(dm =>
      dm.material_id === material_id ? { ...dm, quantity: parseFloat(qty) || 0 } : dm
    ))
  }

  const materialCost = designMaterials.reduce((sum, dm) => {
    return sum + (dm.quantity * (dm.material?.cost_per_unit ?? 0))
  }, 0)
  const labor = parseFloat(laborCost) || 0
  const totalCost = materialCost + labor
  const sale = parseFloat(salePrice) || 0
  const profit = sale > 0 ? sale - totalCost : null
  const margin = sale > 0 ? ((profit / sale) * 100).toFixed(1) : null

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)

    const designPayload = {
      name: name.trim(),
      type,
      notes: notes.trim() || null,
      labor_cost: labor || 0,
      sale_price: sale || null,
      updated_at: new Date().toISOString()
    }

    let designId = id
    if (isNew) {
      const { data, error } = await supabase.from('designs').insert(designPayload).select().single()
      if (error) { setSaving(false); alert(error.message); return }
      designId = data.id
    } else {
      await supabase.from('designs').update(designPayload).eq('id', id)
      await supabase.from('design_materials').delete().eq('design_id', id)
    }

    if (designMaterials.length > 0) {
      await supabase.from('design_materials').insert(
        designMaterials.map(dm => ({
          design_id: designId,
          material_id: dm.material_id,
          quantity: dm.quantity
        }))
      )
    }

    setSaving(false)
    navigate('/designs')
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este diseño?')) return
    await supabase.from('design_materials').delete().eq('design_id', id)
    await supabase.from('designs').delete().eq('id', id)
    navigate('/designs')
  }

  const availableMaterials = allMaterials.filter(m =>
    !designMaterials.find(dm => dm.material_id === m.id)
  )

  if (loading) return <div className="p-6 text-center text-gray-400 py-16">Cargando...</div>

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/designs')}
          className="text-gray-400 hover:text-gray-600 text-sm">
          ← Volver
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          {isNew ? 'Nuevo diseño' : 'Editar diseño'}
        </h1>
      </div>

      <div className="space-y-4">
        {/* Basic info */}
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Nombre *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              placeholder="Ej: Pulsera de hilo dorado"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">Tipo</label>
            <div className="flex gap-2 flex-wrap">
              {DESIGN_TYPES.map(t => (
                <button key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                    type === t ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none"
              placeholder="Notas sobre esta pieza..."
            />
          </div>
        </div>

        {/* Materials */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-800 text-sm">Materiales</h2>
            {availableMaterials.length > 0 && (
              <button onClick={() => setShowAddMaterial(!showAddMaterial)}
                className="text-xs text-rose-500 font-medium">
                {showAddMaterial ? 'Cancelar' : '+ Agregar'}
              </button>
            )}
          </div>

          {showAddMaterial && (
            <div className="bg-rose-50 rounded-xl p-3 mb-3 space-y-2">
              <select
                value={selectedMaterialId}
                onChange={e => setSelectedMaterialId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
                <option value="">Seleccionar material...</option>
                {availableMaterials.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} (€{parseFloat(m.cost_per_unit).toFixed(4)}/{m.unit})
                  </option>
                ))}
              </select>
              {selectedMaterialId && (
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={selectedQty}
                    onChange={e => setSelectedQty(e.target.value)}
                    placeholder={`Cant. en ${allMaterials.find(m => m.id === selectedMaterialId)?.unit ?? 'unidades'}`}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                  <button onClick={addMaterial}
                    disabled={!selectedQty}
                    className="bg-rose-500 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
                    Agregar
                  </button>
                </div>
              )}
            </div>
          )}

          {designMaterials.length === 0 ? (
            <div className="text-center text-gray-400 py-4 text-sm">
              {allMaterials.length === 0
                ? 'Primero agrega materiales a tu stock.'
                : 'Aún no hay materiales en este diseño.'}
            </div>
          ) : (
            <div className="space-y-2">
              {designMaterials.map(dm => {
                const lineCost = dm.quantity * (dm.material?.cost_per_unit ?? 0)
                return (
                  <div key={dm.material_id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-700 truncate">{dm.material?.name}</div>
                      <div className="text-xs text-rose-400">€{lineCost.toFixed(4)}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={dm.quantity}
                        onChange={e => updateQty(dm.material_id, e.target.value)}
                        className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-rose-200"
                      />
                      <span className="text-xs text-gray-400 w-8">{dm.material?.unit}</span>
                    </div>
                    <button onClick={() => removeMaterial(dm.material_id)}
                      className="text-gray-300 hover:text-red-400 text-xl leading-none px-1 shrink-0">
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Costs & Pricing */}
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm">Costos y precio</h2>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Mano de obra (€)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={laborCost}
              onChange={e => setLaborCost(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              placeholder="0.00"
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Materiales</span>
              <span>€{materialCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Mano de obra</span>
              <span>€{labor.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-700 pt-1.5 border-t border-gray-200">
              <span>Costo total</span>
              <span>€{totalCost.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Precio de venta (€)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={salePrice}
              onChange={e => setSalePrice(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              placeholder="Ingresa tu precio..."
            />
          </div>

          {sale > 0 && (
            <div className={`rounded-xl p-4 ${profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Ganancia</div>
                  <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    €{profit.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-0.5">Margen</div>
                  <div className={`text-2xl font-bold ${parseFloat(margin) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {margin}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="w-full bg-rose-500 text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-rose-600 disabled:opacity-50 transition-colors">
          {saving ? 'Guardando...' : isNew ? 'Crear diseño' : 'Guardar cambios'}
        </button>

        {!isNew && (
          <button
            onClick={handleDelete}
            className="w-full border border-red-200 text-red-400 rounded-xl py-3 font-medium text-sm hover:bg-red-50 transition-colors">
            Eliminar diseño
          </button>
        )}
      </div>
    </div>
  )
}
