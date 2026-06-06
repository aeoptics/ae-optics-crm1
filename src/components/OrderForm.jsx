import { useState, useEffect } from 'react'
import { supabase, SOURCES, GLASSES_TYPES, LENS_TYPES, FRAME_TYPES, SHIPPING_COMPANIES, DELIVERY_RESULTS, REFUSAL_REASONS, PAYMENT_STATUSES, ALL_STATUSES, STATUS_COLORS } from '../lib/supabase'
import { X, Save, ChevronDown } from 'lucide-react'

const isMedical = t => t?.startsWith('طبية')

export default function OrderForm({ order, onClose, onSave }) {
  const isEdit = !!order?.id
  const [frames, setFrames] = useState([])
  const [pricing, setPricing] = useState({})
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  const [f, setF] = useState({
    order_date: order?.order_date || new Date().toISOString().split('T')[0],
    customer_name: order?.customer_name || '',
    customer_phone: order?.customer_phone || '',
    source: order?.source || '',
    glasses_type: order?.glasses_type || '',
    frame_name: order?.frame_name || '',
    frame_type: order?.frame_type || '',
    lens_type: order?.lens_type || '',
    order_value: order?.order_value || '',
    shipping_value: order?.shipping_value || '',
    discount: order?.discount || '',
    confirmed: order?.confirmed || false,
    status: order?.status || 'Pending Confirmation',
    needs_workshop: order?.needs_workshop ?? null,
    workshop_sent_date: order?.workshop_sent_date || '',
    workshop_return_date: order?.workshop_return_date || '',
    shipping_date: order?.shipping_date || '',
    shipping_company: order?.shipping_company || '',
    tracking_number: order?.tracking_number || '',
    expected_delivery: order?.expected_delivery || '',
    actual_delivery: order?.actual_delivery || '',
    delivery_result: order?.delivery_result || '',
    refusal_reason: order?.refusal_reason || '',
    payment_status: order?.payment_status || 'عند الاستلام',
    lead_source_detail: order?.lead_source_detail || '',
    assigned_to: order?.assigned_to || '',
    notes: order?.notes || '',
    actual_shipping_cost: order?.actual_shipping_cost || '',
  })

  useEffect(() => {
    supabase.from('inventory').select('id,name,cost_price,sell_price').gt('qty_available', 0).then(({ data }) => setFrames(data || []))
    supabase.from('pricing_settings').select('*').then(({ data }) => {
      const map = {}
      data?.forEach(p => { map[p.frame_type] = p.manuf_cost })
      setPricing(map)
    })
  }, [])

  // Auto-set needs_workshop based on glasses type
  useEffect(() => {
    if (f.glasses_type) setF(p => ({ ...p, needs_workshop: isMedical(f.glasses_type) }))
  }, [f.glasses_type])

  const up = (k, v) => setF(p => ({ ...p, [k]: v }))

  // Derived costs
  const frameObj = frames.find(fr => fr.name === f.frame_name)
  const frameCost = frameObj?.cost_price || 0
  const manufCost = pricing[f.frame_type] || 0
  const shippingSupport = Math.max((Number(f.actual_shipping_cost) || 0) - (Number(f.shipping_value) || 0), 0)
  const totalCost = frameCost + manufCost + shippingSupport
  const totalFinal = (Number(f.order_value) || 0) + (Number(f.shipping_value) || 0) - (Number(f.discount) || 0)
  const profit = totalFinal - totalCost
  const margin = totalFinal > 0 ? profit / totalFinal : 0

  const handleSave = async () => {
    if (!f.customer_name || !f.order_date) return
    setSaving(true)
    const payload = {
      ...f,
      order_value: Number(f.order_value) || 0,
      shipping_value: Number(f.shipping_value) || 0,
      discount: Number(f.discount) || 0,
      actual_shipping_cost: Number(f.actual_shipping_cost) || 0,
      frame_cost: frameCost,
      manuf_cost: manufCost,
      total_cost: totalCost,
      actual_profit: profit,
      profit_margin: margin,
    }
    // Clean empty strings to null
    Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null })

    let error
    if (isEdit) {
      ({ error } = await supabase.from('orders').update(payload).eq('id', order.id))
    } else {
      ({ error } = await supabase.from('orders').insert(payload))
    }
    setSaving(false)
    if (!error) onSave()
  }

  const tabs = [
    { id: 'basic',    label: 'الطلب' },
    { id: 'shipping', label: 'الشحن' },
    { id: 'cost',     label: 'التكاليف' },
    { id: 'notes',    label: 'ملاحظات' },
  ]

  const Field = ({ label, children }) => (
    <div><label className="label">{label}</label>{children}</div>
  )

  const Sel = ({ k, opts, placeholder = 'اختر...' }) => (
    <select className="select" value={f[k]} onChange={e => up(k, e.target.value)}>
      <option value="">{placeholder}</option>
      {opts.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  )

  const Inp = ({ k, type = 'text', placeholder = '', dir }) => (
    <input type={type} className="input" placeholder={placeholder}
      value={f[k]} onChange={e => up(k, e.target.value)} dir={dir}/>
  )

  const sc = STATUS_COLORS[f.status] || STATUS_COLORS['Pending Confirmation']

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'تعديل الطلب' : 'طلب جديد'}</h2>
            {isEdit && <p className="text-xs text-gray-400 mt-0.5 font-mono">{order.order_number}</p>}
          </div>
          <div className="flex items-center gap-3">
            <span className={`badge ${sc.badge} text-xs`}>
              <span className={`status-dot ${sc.dot}`}/>{sc.label}
            </span>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18}/></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >{t.label}</button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {/* TAB: Basic */}
          {activeTab === 'basic' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="اسم العميل *"><Inp k="customer_name" placeholder="الاسم الكامل"/></Field>
                <Field label="رقم العميل"><Inp k="customer_phone" placeholder="01xxxxxxxxx" dir="ltr"/></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="تاريخ الطلب *"><Inp k="order_date" type="date"/></Field>
                <Field label="مصدر الطلب"><Sel k="source" opts={SOURCES}/></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="نوع النظارة">
                  <Sel k="glasses_type" opts={GLASSES_TYPES}/>
                </Field>
                <Field label="نوع الفريم">
                  <Sel k="frame_type" opts={FRAME_TYPES}/>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="الفريم المختار (من المخزون)">
                  <select className="select" value={f.frame_name} onChange={e => up('frame_name', e.target.value)}>
                    <option value="">اختر فريم...</option>
                    {frames.map(fr => <option key={fr.id} value={fr.name}>{fr.name}</option>)}
                  </select>
                </Field>
                <Field label="نوع العدسة"><Sel k="lens_type" opts={LENS_TYPES}/></Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="قيمة الطلب (ج)"><Inp k="order_value" type="number" placeholder="0"/></Field>
                <Field label="قيمة الشحن (ج)"><Inp k="shipping_value" type="number" placeholder="0"/></Field>
                <Field label="الخصم (ج)"><Inp k="discount" type="number" placeholder="0"/></Field>
              </div>
              {/* Total preview */}
              <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-700">الإجمالي النهائي للعميل</span>
                <span className="text-2xl font-extrabold text-blue-700">{totalFinal.toLocaleString()} ج</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="الحالة الحالية">
                  <select className="select" value={f.status} onChange={e => up('status', e.target.value)}>
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_COLORS[s]?.label} ({s})</option>)}
                  </select>
                </Field>
                <Field label="حالة الدفع"><Sel k="payment_status" opts={PAYMENT_STATUSES}/></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="منسوب للموظف"><Inp k="assigned_to" placeholder="اسم الموظف"/></Field>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input type="checkbox" checked={f.confirmed} onChange={e => up('confirmed', e.target.checked)}
                      className="w-5 h-5 rounded accent-blue-600"/>
                    <span className="text-sm font-semibold text-gray-700">تم التأكيد مع العميل؟</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* TAB: Shipping */}
          {activeTab === 'shipping' && (
            <>
              {f.needs_workshop && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700 font-semibold">
                  🔧 هذا الطلب يحتاج ورشة — تأكد من تسجيل تاريخ الإرسال والاستلام
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Field label="تاريخ إرسال الورشة"><Inp k="workshop_sent_date" type="date"/></Field>
                <Field label="تاريخ رجوع الورشة"><Inp k="workshop_return_date" type="date"/></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="تاريخ الشحن"><Inp k="shipping_date" type="date"/></Field>
                <Field label="شركة الشحن"><Sel k="shipping_company" opts={SHIPPING_COMPANIES}/></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="رقم التتبع"><Inp k="tracking_number" dir="ltr" placeholder="TRK-..."/></Field>
                <Field label="تاريخ التسليم المتوقع"><Inp k="expected_delivery" type="date"/></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="تاريخ التسليم الفعلي"><Inp k="actual_delivery" type="date"/></Field>
                <Field label="نتيجة التسليم"><Sel k="delivery_result" opts={DELIVERY_RESULTS}/></Field>
              </div>
              {(f.delivery_result === 'رفض الاستلام' || f.delivery_result === 'مرتجع') && (
                <Field label="سبب الرفض / المرتجع"><Sel k="refusal_reason" opts={REFUSAL_REASONS}/></Field>
              )}
            </>
          )}

          {/* TAB: Costs */}
          {activeTab === 'cost' && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                ⚠️ هذه التكاليف لحساب الربحية الداخلية فقط — لا تظهر للعميل
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-xs text-gray-400 mb-1">تكلفة الفريم (من المخزون)</div>
                  <div className="text-lg font-bold text-gray-700">{frameCost.toLocaleString()} ج</div>
                  <div className="text-xs text-gray-400 mt-0.5">{f.frame_name || 'لم يُختر فريم'}</div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-xs text-gray-400 mb-1">تكلفة المصنعية</div>
                  <div className="text-lg font-bold text-gray-700">{manufCost.toLocaleString()} ج</div>
                  <div className="text-xs text-gray-400 mt-0.5">{f.frame_type || 'لم يُحدد نوع الفريم'}</div>
                </div>
              </div>
              <Field label="تكلفة الشحن الفعلية (ما تدفعه لشركة الشحن)">
                <Inp k="actual_shipping_cost" type="number" placeholder="0"/>
              </Field>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div className="rounded-xl bg-orange-50 p-3">
                  <div className="text-xs text-orange-600 mb-1">دعم الشحن</div>
                  <div className="text-lg font-bold text-orange-700">{shippingSupport.toLocaleString()} ج</div>
                </div>
                <div className="rounded-xl bg-red-50 p-3">
                  <div className="text-xs text-red-600 mb-1">إجمالي التكلفة</div>
                  <div className="text-lg font-bold text-red-700">{totalCost.toLocaleString()} ج</div>
                </div>
                <div className={`rounded-xl p-3 ${profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className={`text-xs mb-1 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>الربح الفعلي</div>
                  <div className={`text-lg font-bold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {profit.toLocaleString()} ج
                  </div>
                  <div className={`text-xs mt-0.5 ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(margin * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB: Notes */}
          {activeTab === 'notes' && (
            <>
              <Field label="تفاصيل مصدر الطلب">
                <Inp k="lead_source_detail" placeholder="مثال: إعلان فيسبوك رقم 42"/>
              </Field>
              <Field label="ملاحظات">
                <textarea className="input h-28 resize-none" value={f.notes}
                  onChange={e => up('notes', e.target.value)} placeholder="أي ملاحظات على الطلب..."/>
              </Field>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Save size={15}/>}
            {saving ? 'جارٍ الحفظ...' : 'حفظ الطلب'}
          </button>
        </div>
      </div>
    </div>
  )
}
