// ── Customers Page ────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { supabase, fmt, STATUS_COLORS } from '../lib/supabase'
import { Users, Phone, ShoppingBag, DollarSign, Search } from 'lucide-react'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    supabase.from('orders').select('customer_name,customer_phone,order_date,order_number,total_final,status,actual_profit')
      .order('order_date', { ascending: false })
      .then(({ data }) => {
        // Group by phone
        const map = {}
        ;(data || []).forEach(o => {
          const key = o.customer_phone || o.customer_name
          if (!map[key]) map[key] = { name: o.customer_name, phone: o.customer_phone, orders: [], total: 0, profit: 0, lastDate: o.order_date, lastStatus: o.status }
          map[key].orders.push(o)
          map[key].total += (o.total_final || 0)
          map[key].profit += (o.actual_profit || 0)
          if (o.order_date > map[key].lastDate) { map[key].lastDate = o.order_date; map[key].lastStatus = o.status }
        })
        setCustomers(Object.values(map).sort((a, b) => b.orders.length - a.orders.length))
        setLoading(false)
      })
  }, [])

  const filtered = customers.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  )

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="page-title">أرشيف العملاء</h1>
        <p className="text-sm text-gray-400 mt-0.5">{customers.length} عميل</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي العملاء', value: customers.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'عملاء متكررون', value: customers.filter(c => c.orders.length > 1).length, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'إجمالي الإيرادات', value: fmt(customers.reduce((s,c)=>s+c.total,0)), icon: DollarSign, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'متوسط الطلبات', value: customers.length ? (customers.reduce((s,c)=>s+c.orders.length,0)/customers.length).toFixed(1) : 0, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`card flex items-center gap-3 ${bg} border-0`}>
            <Icon size={20} className={color}/>
            <div><div className="text-xs text-gray-500">{label}</div><div className={`text-xl font-extrabold ${color}`}>{value}</div></div>
          </div>
        ))}
      </div>
      <div className="card !p-3">
        <div className="relative">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="input pr-9" placeholder="بحث بالاسم أو الموبايل..."
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>
      <div className="card !p-0 overflow-hidden">
        {loading ? <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>
        : filtered.length === 0 ? <div className="text-center py-16 text-gray-300"><Users size={40} className="mx-auto mb-3"/><p className="text-sm text-gray-400">لا توجد بيانات</p></div>
        : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  {['العميل','الموبايل','عدد الطلبات','إجمالي الإنفاق','إجمالي الربح','آخر طلب','آخر حالة'].map(h=>(
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c,i) => {
                  const sc = STATUS_COLORS[c.lastStatus] || STATUS_COLORS['Pending Confirmation']
                  return (
                    <tr key={i} className="table-row">
                      <td className="table-cell"><div className="font-semibold text-gray-800">{c.name}</div></td>
                      <td className="table-cell text-sm font-mono text-gray-500" dir="ltr">{c.phone}</td>
                      <td className="table-cell text-center">
                        <span className={`badge ${c.orders.length > 1 ? 'pill-green' : 'pill-blue'}`}>{c.orders.length}</span>
                      </td>
                      <td className="table-cell font-bold">{fmt(c.total)}</td>
                      <td className="table-cell"><span className={`font-bold ${c.profit>=0?'text-green-600':'text-red-500'}`}>{fmt(c.profit)}</span></td>
                      <td className="table-cell text-xs text-gray-400">{c.lastDate}</td>
                      <td className="table-cell"><span className={`badge ${sc.badge}`}><span className={`status-dot ${sc.dot}`}/>{sc.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
