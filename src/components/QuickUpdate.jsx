import { useState } from 'react'
import { supabase, STATUS_COLORS, ALL_STATUSES, DELIVERY_RESULTS, REFUSAL_REASONS, SHIPPING_COMPANIES } from '../lib/supabase'
import { X, Zap, Save } from 'lucide-react'

export default function QuickUpdate({ order, onClose, onSave }) {
  const [status, setStatus] = useState(order.status)
  const [shippingCompany, setShippingCompany] = useState(order.shipping_company || '')
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '')
  const [shippingDate, setShippingDate] = useState(order.shipping_date || '')
  const [expectedDelivery, setExpectedDelivery] = useState(order.expected_delivery || '')
  const [actualDelivery, setActualDelivery] = useState(order.actual_delivery || '')
  const [deliveryResult, setDeliveryResult] = useState(order.delivery_result || '')
  const [refusalReason, setRefusalReason] = useState(order.refusal_reason || '')
  const [workshopSent, setWorkshopSent] = useState(order.workshop_sent_date || '')
  const [workshopReturn, setWorkshopReturn] = useState(order.workshop_return_date || '')
  const [saving, setSaving] = useState(false)

  const needsShipping = ['Shipped','Delivered'].includes(status)
  const needsWorkshop = ['Sent to Workshop','Returned from Workshop'].includes(status)
  const needsResult = ['Refused on Delivery','Returned'].includes(status)

  const handleSave = async () => {
    setSaving(true)
    const payload = { status }
    if (shippingCompany) payload.shipping_company = shippingCompany
    if (trackingNumber) payload.tracking_number = trackingNumber
    if (shippingDate) payload.shipping_date = shippingDate
    if (expectedDelivery) payload.expected_delivery = expectedDelivery
    if (actualDelivery) payload.actual_delivery = actualDelivery
    if (deliveryResult) payload.delivery_result = deliveryResult
    if (refusalReason) payload.refusal_reason = refusalReason
    if (workshopSent) payload.workshop_sent_date = workshopSent
    if (workshopReturn) payload.workshop_return_date = workshopReturn
    const { error } = await supabase.from('orders').update(payload).eq('id', order.id)
    setSaving(false)
    if (!error) onSave()
  }

  const sc = STATUS_COLORS[status] || STATUS_COLORS['Pending Confirmation']

  // Status flow hint
  const is医 = order.glasses_type?.startsWith('طبية')
  const FLOW = isطبية => isطبية
    ? ['Confirmed','Sent to Workshop','Returned from Workshop','Ready to Ship','Shipped','Delivered']
    : ['Confirmed','In Preparation','Ready to Ship','Shipped','Delivered']
  const flow = FLOW(isمedical)

  const isطبية = order.glasses_type?.startsWith('طبية')
  const currentIdx = flow.indexOf(status)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-md">
        <div className="modal-header">
          <div>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-yellow-500"/>
              <h2 className="text-base font-bold text-gray-900">تحديث سريع</h2>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              <span className="font-mono font-bold text-blue-600">{order.order_number}</span>
              {' — '}{order.customer_name}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18}/></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Flow progress */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-400 mb-2">المسار المتوقع</p>
            <div className="flex items-center gap-1 flex-wrap">
              {flow.map((s, i) => {
                const isCurrent = s === status
                const isPast = currentIdx > i
                return (
                  <div key={s} className="flex items-center gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-all ${
                      isCurrent ? `${STATUS_COLORS[s]?.badge} ring-2 ring-offset-1 ring-blue-400` :
                      isPast ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {STATUS_COLORS[s]?.label}
                    </span>
                    {i < flow.length - 1 && <span className="text-gray-300 text-xs">←</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Status select */}
          <div>
            <label className="label">الحالة الجديدة</label>
            <select className="select text-sm font-semibold" value={status} onChange={e => setStatus(e.target.value)}>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_COLORS[s]?.label} — {s}</option>
              ))}
            </select>
            <div className={`mt-2 rounded-lg px-3 py-2 text-sm font-bold ${sc.badge}`}>
              <span className={`status-dot ${sc.dot}`}/> {sc.label}
            </div>
          </div>

          {/* Conditional fields */}
          {needsWorkshop && (
            <div className="space-y-3 bg-orange-50 rounded-xl p-3">
              <p className="text-xs font-bold text-orange-600">📋 بيانات الورشة</p>
              {status === 'Sent to Workshop' && (
                <div>
                  <label className="label">تاريخ الإرسال للورشة</label>
                  <input type="date" className="input" value={workshopSent} onChange={e => setWorkshopSent(e.target.value)}/>
                </div>
              )}
              {status === 'Returned from Workshop' && (
                <div>
                  <label className="label">تاريخ الرجوع من الورشة</label>
                  <input type="date" className="input" value={workshopReturn} onChange={e => setWorkshopReturn(e.target.value)}/>
                </div>
              )}
            </div>
          )}

          {(status === 'Shipped' || status === 'Ready to Ship') && (
            <div className="space-y-3 bg-blue-50 rounded-xl p-3">
              <p className="text-xs font-bold text-blue-600">📦 بيانات الشحن</p>
              <div>
                <label className="label">شركة الشحن</label>
                <select className="select" value={shippingCompany} onChange={e => setShippingCompany(e.target.value)}>
                  <option value="">اختر...</option>
                  {SHIPPING_COMPANIES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              {status === 'Shipped' && (
                <>
                  <div>
                    <label className="label">رقم التتبع</label>
                    <input className="input font-mono" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} dir="ltr" placeholder="TRK-..."/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">تاريخ الشحن</label>
                      <input type="date" className="input" value={shippingDate} onChange={e => setShippingDate(e.target.value)}/>
                    </div>
                    <div>
                      <label className="label">التسليم المتوقع</label>
                      <input type="date" className="input" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)}/>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {status === 'Delivered' && (
            <div className="bg-green-50 rounded-xl p-3">
              <label className="label text-green-700">تاريخ التسليم الفعلي</label>
              <input type="date" className="input" value={actualDelivery} onChange={e => setActualDelivery(e.target.value)}/>
            </div>
          )}

          {needsResult && (
            <div className="space-y-3 bg-red-50 rounded-xl p-3">
              <p className="text-xs font-bold text-red-600">❌ سبب الرفض / الإرجاع</p>
              <div>
                <label className="label">نتيجة التسليم</label>
                <select className="select" value={deliveryResult} onChange={e => setDeliveryResult(e.target.value)}>
                  <option value="">اختر...</option>
                  {DELIVERY_RESULTS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="label">السبب</label>
                <select className="select" value={refusalReason} onChange={e => setRefusalReason(e.target.value)}>
                  <option value="">اختر...</option>
                  {REFUSAL_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Save size={15}/>}
            تحديث الحالة
          </button>
        </div>
      </div>
    </div>
  )
}
