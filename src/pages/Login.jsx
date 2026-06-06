import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) { setError('البريد الإلكتروني أو كلمة المرور غير صحيحة'); setLoading(false) }
    else navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo card */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-2xl shadow-blue-500/40">👓</div>
          <h1 className="text-3xl font-extrabold text-gray-900">AE Optics</h1>
          <p className="text-gray-500 mt-1 text-sm">نظام إدارة الطلبات والمخزون</p>
        </div>

        <div className="card shadow-xl border-0">
          <h2 className="text-lg font-bold text-gray-800 mb-6 text-center">تسجيل الدخول</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">البريد الإلكتروني</label>
              <input
                type="email"
                className="input"
                placeholder="example@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>

            <div>
              <label className="label">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pe-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
              ) : (
                <LogIn size={18}/>
              )}
              {loading ? 'جارٍ الدخول...' : 'دخول'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          AE Optics CRM — نظام إدارة متجر النظارات الأونلاين
        </p>
      </div>
    </div>
  )
}
