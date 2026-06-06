import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, Wrench, Package, Users, TrendingUp, Settings, Menu, Truck, TrendingDown, UserCheck } from 'lucide-react'

const NAV = [
  { to:'/',          icon:LayoutDashboard, label:'Dashboard',        en:'Dashboard' },
  { to:'/orders',    icon:ShoppingBag,     label:'الطلبات',          en:'Orders' },
  { to:'/tracker',   icon:Truck,           label:'متابعة التوصيل',   en:'Tracker' },
  { to:'/workshop',  icon:Wrench,          label:'الورشة',           en:'Workshop' },
  { to:'/inventory', icon:Package,         label:'المخزون',          en:'Inventory' },
  { to:'/customers', icon:Users,           label:'العملاء',          en:'Customers' },
  { to:'/revenue',   icon:TrendingUp,      label:'الإيرادات',        en:'Revenue' },
  { to:'/expenses',  icon:TrendingDown,    label:'المصروفات',        en:'Expenses' },
  { to:'/employees', icon:UserCheck,       label:'الموظفون',         en:'Employees' },
  { to:'/settings',  icon:Settings,        label:'الإعدادات',        en:'Settings' },
]

export default function Layout() {
  const [open, setOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-500/30">👓</div>
          <div>
            <div className="font-extrabold text-gray-900 text-sm leading-tight">AE Optics</div>
            <div className="text-xs text-gray-400">نظام إدارة المتجر</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({to,icon:Icon,label,en})=>(
          <NavLink key={to} to={to} end={to==='/'}
            onClick={()=>setOpen(false)}
            className={({isActive})=>'sidebar-item '+(isActive?'sidebar-active':'sidebar-inactive')}
          >
            <Icon size={17} strokeWidth={2}/>
            <span className="text-sm">{label}</span>
            <span className="ms-auto text-xs opacity-30 font-normal hidden lg:block">{en}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50">
          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">AE</div>
          <div className="text-xs font-semibold text-gray-600 truncate">AE Optics CRM v3</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="hidden lg:flex flex-col w-56 bg-white border-l border-gray-100 shadow-sm flex-shrink-0">
        <SidebarContent/>
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setOpen(false)}/>
          <aside className="absolute right-0 top-0 h-full w-60 bg-white shadow-2xl"><SidebarContent/></aside>
        </div>
      )}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">👓</span>
            <span className="font-extrabold text-gray-900 text-sm">AE Optics CRM</span>
          </div>
          <button onClick={()=>setOpen(true)} className="p-2 rounded-xl hover:bg-gray-100">
            <Menu size={20} className="text-gray-600"/>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto"><Outlet/></div>
      </main>
    </div>
  )
}
