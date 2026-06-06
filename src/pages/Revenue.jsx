import { useState, useEffect } from 'react'
import { supabase, fmt, fmtPct, SOURCES } from '../lib/supabase'
import { TrendingUp, DollarSign, BarChart3, Percent } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts'

const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#EC4899','#84CC16']

const TT = ({ active, payload, label }) => active && payload?.length ? (
  <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs font-semibold">
    <p className="text-gray-500 mb-1">{label}</p>
    {payload.map((p,i) => <p key={i} style={{color:p.color}}>{p.name}: {typeof p.value === 'number' && p.value > 100 ? fmt(p.value) : p.value}</p>)}
  </div>
) : null

export default function Revenue() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('orders').select('*').then(({ data }) => {
      setOrders(data || [])
      setLoading(false)
    })
  }, [])

  const delivered = orders.filter(o => o.status === 'Delivered')
  const revenue = delivered.reduce((s,o) => s+(o.total_final||0), 0)
  const profit = delivered.reduce((s,o) => s+(o.actual_profit||0), 0)
  const costs = delivered.reduce((s,o) => s+(o.total_cost||0), 0)
  const discounts = orders.reduce((s,o) => s+(o.discount||0), 0)
  const shippingSupport = orders.reduce((s,o) => s+(o.shipping_support||0), 0)
  const avgMargin = delivered.length ? delivered.reduce((s,o)=>s+(o.profit_margin||0),0)/delivered.length : 0
  const avgOrder = delivered.length ? revenue/delivered.length : 0

  const refused = orders.filter(o=>o.status==='Refused on Delivery').length
  const returned = orders.filter(o=>o.status==='Returned').length
  const deliveryRate = orders.length ? delivered.length/orders.length : 0

  // Monthly
  const monthly = MONTHS.map((m,i) => {
    const mo = delivered.filter(o => o.order_date && new Date(o.order_date).getMonth()===i)
    return { name: m.slice(0,3), إيرادات: mo.reduce((s,o)=>s+(o.total_final||0),0), ربح: mo.reduce((s,o)=>s+(o.actual_profit||0),0), طلبات: mo.length }
  })

  // By source
  const bySource = SOURCES.map(s => ({
    name: s,
    إيرادات: delivered.filter(o=>o.source===s).reduce((s,o)=>s+(o.total_final||0),0),
    طلبات: orders.filter(o=>o.source===s).length,
  })).filter(s=>s.طلبات>0).sort((a,b)=>b.إيرادات-a.إيرادات)

  // By glasses type
  const typeMap = {}
  delivered.forEach(o => {
    const t = o.glasses_type || 'غير محدد'
    if (!typeMap[t]) typeMap[t] = { revenue: 0, count: 0, profit: 0 }
    typeMap[t].revenue += (o.total_final||0)
    typeMap[t].count++
    typeMap[t].profit += (o.actual_profit||0)
  })
  const byType = Object.entries(typeMap).map(([name,v])=>({ name, ...v })).sort((a,b)=>b.revenue-a.revenue)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="page-title">تحليل الإيرادات والربحية</h1>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي الإيرادات', value: fmt(revenue), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'إجمالي الأرباح', value: fmt(profit), icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'متوسط هامش الربح', value: fmtPct(avgMargin), icon: Percent, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'متوسط قيمة الطلب', value: fmt(avgOrder), icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`card flex items-center gap-3 ${bg} border-0`}>
            <Icon size={20} className={color}/>
            <div><div className="text-xs text-gray-500">{label}</div><div className={`text-xl font-extrabold ${color}`}>{value}</div></div>
          </div>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'إجمالي التكاليف', value: fmt(costs), color: 'text-red-600' },
          { label: 'إجمالي الخصومات', value: fmt(discounts), color: 'text-orange-600' },
          { label: 'دعم الشحن', value: fmt(shippingSupport), color: 'text-amber-600' },
          { label: 'نسبة التسليم', value: fmtPct(deliveryRate), color: 'text-green-600' },
          { label: 'مرفوض + مرتجع', value: refused+returned, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card">
            <div className="text-xs text-gray-400">{label}</div>
            <div className={`text-xl font-extrabold ${color} mt-1`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Monthly chart */}
      <div className="card">
        <h3 className="section-title">الإيرادات والأرباح الشهرية</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthly} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Cairo' }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false}/>
            <Tooltip content={<TT/>}/>
            <Legend wrapperStyle={{ fontFamily: 'Cairo', fontSize: 12 }}/>
            <Bar dataKey="إيرادات" fill="#3B82F6" radius={[3,3,0,0]} barSize={14}/>
            <Bar dataKey="ربح" fill="#10B981" radius={[3,3,0,0]} barSize={14}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By source */}
        <div className="card">
          <h3 className="section-title">إيرادات حسب المصدر</h3>
          {bySource.length === 0 ? <div className="text-center py-10 text-gray-300 text-sm">لا توجد بيانات</div> : (
            <div className="space-y-3 mt-4">
              {bySource.map(({ name, إيرادات, طلبات }, i) => (
                <div key={name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-semibold text-gray-700">{name}</span>
                    <div className="flex gap-3">
                      <span className="text-xs text-gray-400">{طلبات} طلب</span>
                      <span className="font-bold text-blue-600">{fmt(إيرادات)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-2 rounded-full" style={{ width: `${revenue>0?(إيرادات/revenue)*100:0}%`, background: COLORS[i%COLORS.length] }}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By type */}
        <div className="card">
          <h3 className="section-title">إيرادات حسب نوع النظارة</h3>
          {byType.length === 0 ? <div className="text-center py-10 text-gray-300 text-sm">لا توجد بيانات</div> : (
            <div className="space-y-3 mt-4">
              {byType.map(({ name, revenue: r, count, profit: p }, i) => (
                <div key={name} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-2.5 h-10 rounded-full flex-shrink-0" style={{ background: COLORS[i%COLORS.length] }}/>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-700">{name}</div>
                    <div className="text-xs text-gray-400">{count} طلب</div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-blue-600">{fmt(r)}</div>
                    <div className={`text-xs font-semibold ${p>=0?'text-green-600':'text-red-500'}`}>{fmt(p)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
