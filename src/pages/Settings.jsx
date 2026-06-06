import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Save, Settings as SettingsIcon, DollarSign, Users, Key, CheckCircle } from 'lucide-react'

export default function Settings() {
  const [pricing, setPricing] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '' })
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')

  useEffect(() => {
    supabase.from('pricing_settings').select('*').order('frame_type').then(({ data }) => {
      setPricing(data || [])
      setLoading(false)
    })
  }, [])

  const updatePrice = (id, val) => {
    setPricing(p => p.map(r => r.id === id ? { ...r, manuf_cost: Number(val) } : r))
  }

  const savePricing = async () => {
    setSaving(true)
    for (const p of pricing) {
      await supabase.from('pricing_settings').update({ manuf_cost: p.manuf_cost }).eq('id', p.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const inviteUser = async () => {
    if (!newUser.email || !newUser.password) return
    setInviting(true)
    const { error } = await supabase.auth.signUp({ email: newUser.email, password: newUser.password })
    setInviting(false)
    setInviteMsg(error ? `خطأ: ${error.message}` : `✅ تم إنشاء الحساب: ${newUser.email}`)
    setNewUser({ email: '', password: '' })
  }

  const FRAME_AR = { 'Full Frame': 'فريم كامل', 'Half Frame': 'نصف فريم', 'Rimless': 'بدون إطار' }
  const FRAME_ICONS = { 'Full Frame': '🔲', 'Half Frame': '⬜', 'Rimless': '⭕' }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="page-title">الإعدادات</h1>
        <p className="text-sm text-gray-400 mt-0.5">إعدادات النظام والتسعير</p>
      </div>

      {/* Pricing settings */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <DollarSign size={20} className="text-indigo-600"/>
          </div>
          <div>
            <h2 className="font-bold text-gray-900">تكلفة المصنعية</h2>
            <p className="text-xs text-gray-400">تُستخدم في حساب الربحية فقط — لا تظهر للعميل</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"/>)}
          </div>
        ) : (
          <div className="space-y-4">
            {pricing.map(p => (
              <div key={p.id} className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
                <div className="text-2xl">{FRAME_ICONS[p.frame_type] || '🖼️'}</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{p.frame_type}</div>
                  <div className="text-xs text-gray-400">{FRAME_AR[p.frame_type]}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={p.manuf_cost}
                    onChange={e => updatePrice(p.id, e.target.value)}
                    className="input w-32 text-center font-bold"
                    min="0"
                  />
                  <span className="text-sm text-gray-400 font-semibold">ج</span>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              {saved && (
                <span className="flex items-center gap-1.5 text-green-600 text-sm font-semibold">
                  <CheckCircle size={16}/> تم الحفظ بنجاح
                </span>
              )}
              <button onClick={savePricing} disabled={saving} className="btn-primary ms-auto disabled:opacity-60">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Save size={15}/>}
                {saving ? 'جارٍ الحفظ...' : 'حفظ الأسعار'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Team management */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Users size={20} className="text-blue-600"/>
          </div>
          <div>
            <h2 className="font-bold text-gray-900">إدارة الفريق</h2>
            <p className="text-xs text-gray-400">إضافة مستخدمين جدد للنظام</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 mb-5">
          ⚠️ بعد إنشاء الحساب، يجب على المستخدم الجديد تأكيد بريده الإلكتروني إذا كان تأكيد الإيميل مفعلاً في Supabase
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">البريد الإلكتروني</label>
              <input type="email" className="input" value={newUser.email}
                onChange={e => setNewUser(p => ({...p, email: e.target.value}))}
                placeholder="email@example.com" dir="ltr"/>
            </div>
            <div>
              <label className="label">كلمة المرور</label>
              <input type="password" className="input" value={newUser.password}
                onChange={e => setNewUser(p => ({...p, password: e.target.value}))}
                placeholder="على الأقل 6 أحرف"/>
            </div>
          </div>
          {inviteMsg && (
            <div className={`text-sm px-4 py-3 rounded-xl ${inviteMsg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {inviteMsg}
            </div>
          )}
          <button onClick={inviteUser} disabled={inviting || !newUser.email || !newUser.password}
            className="btn-primary disabled:opacity-60">
            {inviting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Key size={15}/>}
            إنشاء حساب جديد
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="card bg-gray-50 border-0">
        <div className="flex items-center gap-3 mb-3">
          <SettingsIcon size={18} className="text-gray-400"/>
          <h3 className="font-semibold text-gray-700">معلومات النظام</h3>
        </div>
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex justify-between"><span>الإصدار</span><span className="font-mono font-bold text-gray-700">v1.0.0</span></div>
          <div className="flex justify-between"><span>قاعدة البيانات</span><span className="font-bold text-gray-700">Supabase PostgreSQL</span></div>
          <div className="flex justify-between"><span>الاستضافة</span><span className="font-bold text-gray-700">GitHub Pages</span></div>
          <div className="flex justify-between"><span>التصميم</span><span className="font-bold text-gray-700">RTL عربي / إنجليزي</span></div>
        </div>
      </div>
    </div>
  )
}
