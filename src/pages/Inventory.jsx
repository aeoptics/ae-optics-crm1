import { useState, useEffect } from 'react'
import { supabase, fmt } from '../lib/supabase'
import { Plus, Save, X, Package, Edit3, Trash2, Search, AlertTriangle } from 'lucide-react'

const GENDER = ['رجالي','نسائي','أطفال']
const TYPE = ['طبية','شمس']
const STATUS_BADGE = { 'متاح': 'pill-green', 'منخفض': 'pill-yellow', 'نفد': 'pill-red' }

function FrameForm({ frame, onClose, onSave }) {
  const isEdit = !!frame?.id
  const [f, setF] = useState({
    name: frame?.name || '',
    type: frame?.type || '',
    gender: frame?.gender || '',
    size: frame?.size || '',
    color: frame?.color || '',
    qty_total: frame?.qty_total || '',
    qty_reserved: frame?.qty_reserved || 0,
    cost_price: frame?.cost_price || '',
    sell_price: frame?.sell_price || '',
    notes: frame?.notes || '',
  })
  const [saving, setSaving] = useState(false)

  const up = (k, v) => setF(p => ({ ...p, [k]: v }))
  const available = (Number(f.qty_total) || 0) - (Number(f.qty_reserved) || 0)

  const handleSave = async () => {
    if (!f.name) return
    setSaving(true)
    const payload = {
      ...f,
      qty_total: Number(f.qty_total) || 0,
      qty_reserved: Number(f.qty_reserved) || 0,
      cost_price: Number(f.cost_price) || 0,
      sell_price: Number(f.sell_price) || 0,
    }
    let error
    if (isEdit) ({ error } = await supabase.from('inventory').update(payload).eq('id', frame.id))
    else ({ error } = await supabase.from('inventory').insert(payload))
    setSaving(false)
    if (!error) onSave()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-lg">
        <div className="modal-header">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'تعديل فريم' : 'إضافة فريم'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="label">اسم الفريم *</label>
            <input className="input" value={f.name} onChange={e => up('name', e.target.value)} placeholder="مثال: Ray-Ban Classic"/></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">نوع النظارة</label>
              <select className="select" value={f.type} onChange={e => up('type', e.target.value)}>
                <option value="">اختر...</option>
                {TYPE.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">الجنس</label>
              <select className="select" value={f.gender} onChange={e => up('gender', e.target.value)}>
                <option value="">اختر...</option>
                {GENDER.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">المقاس</label>
              <input className="input" value={f.size} onChange={e => up('size', e.target.value)} placeholder="مثال: 52-18" dir="ltr"/></div>
            <div><label className="label">اللون</label>
              <input className="input" value={f.color} onChange={e => up('color', e.target.value)} placeholder="مثال: أسود"/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">الكمية الإجمالية</label>
              <input type="number" className="input" value={f.qty_total} onChange={e => up('qty_total', e.target.value)}/></div>
            <div><label className="label">الكمية المحجوزة</label>
              <input type="number" className="input" value={f.qty_reserved} onChange={e => up('qty_reserved', e.target.value)}/></div>
          </div>
          {/* Available qty preview */}
          <div className={`rounded-xl p-3 flex items-center justify-between ${available > 3 ? 'bg-green-50' : available > 0 ? 'bg-yellow-50' : 'bg-red-50'}`}>
            <span className="text-sm font-semibold text-gray-600">الكمية المتاحة</span>
            <span className={`text-2xl font-extrabold ${available > 3 ? 'text-green-600' : available > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
              {available}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">سعر التكلفة (ج)</label>
              <input type="number" className="input" value={f.cost_price} onChange={e => up('cost_price', e.target.value)}/></div>
            <div><label className="label">سعر البيع (ج)</label>
              <input type="number" className="input" value={f.sell_price} onChange={e => up('sell_price', e.target.value)}/></div>
          </div>
          <div><label className="label">ملاحظات</label>
            <textarea className="input h-20 resize-none" value={f.notes} onChange={e => up('notes', e.target.value)}/></div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Save size={15}/>}
            حفظ
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Inventory() {
  const [frames, setFrames] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editFrame, setEditFrame] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('inventory').select('*').order('name')
    setFrames(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = frames.filter(f =>
    (!search || f.name?.toLowerCase().includes(search.toLowerCase()) || f.color?.includes(search) || f.size?.includes(search)) &&
    (!filterStatus || f.status === filterStatus)
  )

  const totalFrames = frames.length
  const available = frames.filter(f => f.status === 'متاح').length
  const low = frames.filter(f => f.status === 'منخفض').length
  const outOfStock = frames.filter(f => f.status === 'نفد').length
  const totalQty = frames.reduce((s, f) => s + (f.qty_available || 0), 0)

  const handleDelete = async (id) => {
    if (!window.confirm('حذف هذا الفريم من المخزون؟')) return
    await supabase.from('inventory').delete().eq('id', id)
    load()
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">مخزون الفريمات</h1>
          <p className="text-sm text-gray-400 mt-0.5">{totalFrames} نوع فريم — {totalQty} قطعة متاحة</p>
        </div>
        <button onClick={() => { setEditFrame(null); setShowForm(true) }} className="btn-primary">
          <Plus size={16}/> إضافة فريم
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'متاح', value: available, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'منخفض', value: low, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'نفد', value: outOfStock, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'إجمالي الكمية', value: totalQty, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`card ${bg} border-0`}>
            <div className="text-xs text-gray-500">{label}</div>
            <div className={`text-2xl font-extrabold ${color} mt-1`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Alert for low/out */}
      {(low > 0 || outOfStock > 0) && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-amber-500 flex-shrink-0"/>
          <p className="text-sm text-amber-700 font-semibold">
            {outOfStock > 0 && `${outOfStock} فريم نفدت الكمية`}
            {outOfStock > 0 && low > 0 && ' — '}
            {low > 0 && `${low} فريم بكمية منخفضة`}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="card !p-3 flex gap-3 flex-wrap">
        <div className="flex-1 min-w-44 relative">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="input pr-9" placeholder="بحث بالاسم، اللون، المقاس..."
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="select w-auto min-w-32" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">كل الحالات</option>
          <option value="متاح">متاح</option>
          <option value="منخفض">منخفض</option>
          <option value="نفد">نفد</option>
        </select>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package size={40} className="mx-auto mb-3 text-gray-200"/>
            <p className="text-sm text-gray-400">لا توجد فريمات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  {['اسم الفريم','النوع','الجنس','المقاس','اللون','الكمية','المتاح','سعر التكلفة','سعر البيع','الحالة','إجراءات'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(fr => (
                  <tr key={fr.id} className={`table-row group ${fr.status === 'نفد' ? 'bg-red-50/40' : fr.status === 'منخفض' ? 'bg-yellow-50/40' : ''}`}>
                    <td className="table-cell font-semibold text-gray-800">{fr.name}</td>
                    <td className="table-cell text-xs">{fr.type}</td>
                    <td className="table-cell text-xs">{fr.gender}</td>
                    <td className="table-cell text-xs font-mono" dir="ltr">{fr.size}</td>
                    <td className="table-cell text-xs">{fr.color}</td>
                    <td className="table-cell text-center font-semibold">{fr.qty_total}</td>
                    <td className="table-cell text-center">
                      <span className={`font-extrabold text-lg ${(fr.qty_available || 0) > 3 ? 'text-green-600' : (fr.qty_available || 0) > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {fr.qty_available ?? 0}
                      </span>
                    </td>
                    <td className="table-cell text-sm">{fmt(fr.cost_price)}</td>
                    <td className="table-cell text-sm font-semibold">{fmt(fr.sell_price)}</td>
                    <td className="table-cell"><span className={`badge ${STATUS_BADGE[fr.status] || 'pill-gray'}`}>{fr.status}</span></td>
                    <td className="table-cell">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditFrame(fr); setShowForm(true) }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500">
                          <Edit3 size={14}/>
                        </button>
                        <button onClick={() => handleDelete(fr.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <FrameForm frame={editFrame}
          onClose={() => { setShowForm(false); setEditFrame(null) }}
          onSave={() => { setShowForm(false); setEditFrame(null); load() }}
        />
      )}
    </div>
  )
}
