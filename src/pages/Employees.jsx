import { useState, useEffect } from 'react'
import { supabase, ROLES } from '../lib/supabase'
import { Plus, Save, X, Users, Edit3, Trash2, Shield } from 'lucide-react'

const ROLE_PERMISSIONS = {
  admin:       { label:'مدير النظام',    perms:['كل الصلاحيات بدون قيود'] },
  call_center: { label:'كول سنتر',      perms:['مشاهدة الطلبات','بيانات العملاء','تغيير Pending ← Confirmed'] },
  moderator:   { label:'إدخال طلبات',   perms:['إضافة طلبات جديدة','تعديل العملاء قبل التأكيد'] },
  operations:  { label:'موظف تشغيل',   perms:['إدارة حالات التصنيع','تحديث حالة الطلب'] },
  accountant:  { label:'محاسب',          perms:['مشاهدة الأرباح','مشاهدة المصروفات','استخراج التقارير'] },
}

function EmployeeForm({ employee, onClose, onSave }) {
  const isEdit = !!employee?.id
  const [f, setF] = useState({
    name: employee?.name || '',
    role: employee?.role || 'moderator',
    email: '',
    password: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const up = (k,v) => setF(p=>({...p,[k]:v}))

  const handleSave = async () => {
    if (!f.name || !f.role) return
    setSaving(true); setError('')

    if (!isEdit) {
      if (!f.email || !f.password) { setError('الإيميل وكلمة المرور مطلوبين'); setSaving(false); return }
      // Create auth user
      const {data:authData, error:authErr} = await supabase.auth.signUp({ email:f.email, password:f.password })
      if (authErr) { setError(authErr.message); setSaving(false); return }
      // Create employee record
      const {error:empErr} = await supabase.from('employees').insert({
        user_id: authData.user.id, name: f.name, role: f.role
      })
      if (empErr) { setError(empErr.message); setSaving(false); return }
      // Confirm user via SQL
      await supabase.rpc('confirm_user_by_email', { p_email: f.email }).catch(()=>{})
    } else {
      const {error:err} = await supabase.from('employees').update({ name:f.name, role:f.role }).eq('id',employee.id)
      if (err) { setError(err.message); setSaving(false); return }
    }
    setSaving(false); onSave()
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box max-w-md">
        <div className="modal-header">
          <h2 className="text-lg font-bold text-gray-900">{isEdit?'تعديل موظف':'إضافة موظف'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="label">اسم الموظف</label>
            <input className="input" value={f.name} onChange={e=>up('name',e.target.value)} placeholder="الاسم الكامل"/></div>
          <div><label className="label">الصلاحية</label>
            <select className="select" value={f.role} onChange={e=>up('role',e.target.value)}>
              {Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {/* Permissions preview */}
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs font-bold text-blue-700 mb-2">صلاحيات هذا الدور:</p>
            <ul className="space-y-1">
              {ROLE_PERMISSIONS[f.role]?.perms.map((p,i)=>(
                <li key={i} className="text-xs text-blue-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"/>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {!isEdit && <>
            <div><label className="label">البريد الإلكتروني</label>
              <input type="email" className="input" value={f.email} onChange={e=>up('email',e.target.value)} dir="ltr" placeholder="email@example.com"/></div>
            <div><label className="label">كلمة المرور</label>
              <input type="password" className="input" value={f.password} onChange={e=>up('password',e.target.value)} placeholder="على الأقل 6 أحرف"/></div>
          </>}

          {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
            {saving?<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>:<Save size={15}/>}
            {saving?'جارٍ الحفظ...':'حفظ'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editEmp, setEditEmp] = useState(null)

  const load = async () => {
    setLoading(true)
    const {data} = await supabase.from('employees').select('*').order('created_at')
    setEmployees(data||[])
    setLoading(false)
  }
  useEffect(()=>{load()},[])

  const toggleActive = async (emp) => {
    await supabase.from('employees').update({is_active:!emp.is_active}).eq('id',emp.id)
    load()
  }

  const deleteEmp = async (id) => {
    if (!window.confirm('حذف هذا الموظف؟')) return
    await supabase.from('employees').delete().eq('id',id)
    load()
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">إدارة الموظفين</h1>
          <p className="text-sm text-gray-400 mt-0.5">{employees.length} موظف</p>
        </div>
        <button onClick={()=>{setEditEmp(null);setShowForm(true)}} className="btn-primary">
          <Plus size={16}/> إضافة موظف
        </button>
      </div>

      {/* Roles reference */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(ROLES).map(([k,v])=>(
          <div key={k} className="card !p-3">
            <div className={`badge ${v.color} mb-2`}>{v.label}</div>
            <ul className="space-y-1">
              {ROLE_PERMISSIONS[k]?.perms.slice(0,2).map((p,i)=>(
                <li key={i} className="text-xs text-gray-500 flex items-start gap-1">
                  <span className="w-1 h-1 bg-gray-300 rounded-full flex-shrink-0 mt-1.5"/>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-16">
            <Users size={40} className="mx-auto mb-3 text-gray-200"/>
            <p className="text-sm text-gray-400">لا يوجد موظفون بعد</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-100">
                {['الاسم','الصلاحية','الحالة','تاريخ الإضافة','إجراءات'].map(h=>(
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp=>{
                const role = ROLES[emp.role]
                return (
                  <tr key={emp.id} className="table-row group">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                          {emp.name?.[0]}
                        </div>
                        <span className="font-semibold text-gray-800">{emp.name}</span>
                      </div>
                    </td>
                    <td className="table-cell"><span className={`badge ${role?.color||'pill-gray'}`}>{role?.label||emp.role}</span></td>
                    <td className="table-cell">
                      <span className={`badge ${emp.is_active?'pill-green':'pill-gray'}`}>
                        {emp.is_active?'نشط':'غير نشط'}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-gray-400">{new Date(emp.created_at).toLocaleDateString('ar-EG')}</td>
                    <td className="table-cell">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={()=>{setEditEmp(emp);setShowForm(true)}} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Edit3 size={14}/></button>
                        <button onClick={()=>toggleActive(emp)} className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-500"><Shield size={14}/></button>
                        <button onClick={()=>deleteEmp(emp.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <EmployeeForm employee={editEmp}
          onClose={()=>{setShowForm(false);setEditEmp(null)}}
          onSave={()=>{setShowForm(false);setEditEmp(null);load()}}
        />
      )}
    </div>
  )
}
