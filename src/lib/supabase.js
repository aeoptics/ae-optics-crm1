import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ── Status colors ──────────────────────────────────────────────────────
export const STATUS_COLORS = {
  'Pending Confirmation': { bg: 'bg-amber-50',  text: 'text-amber-800',  badge: 'bg-amber-100 text-amber-800',  dot: 'bg-amber-400',  label: 'انتظار التأكيد' },
  'Confirmed':            { bg: 'bg-teal-50',   text: 'text-teal-800',   badge: 'bg-teal-100 text-teal-700',    dot: 'bg-teal-400',   label: 'مؤكد' },
  'In Preparation':       { bg: 'bg-yellow-50', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-800',dot: 'bg-yellow-400', label: 'تحت التجهيز' },
  'Sent to Workshop':     { bg: 'bg-orange-50', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-700',dot: 'bg-orange-400', label: 'في الورشة' },
  'Returned from Workshop':{ bg:'bg-orange-50/60',text:'text-orange-700',badge:'bg-orange-50 text-orange-600',  dot:'bg-orange-300',  label:'رجع من الورشة'},
  'Ready to Ship':        { bg: 'bg-purple-50', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-700',dot: 'bg-purple-400', label: 'جاهز للشحن' },
  'Shipped':              { bg: 'bg-blue-50',   text: 'text-blue-800',   badge: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-400',   label: 'تم الشحن' },
  'Delivered':            { bg: 'bg-green-50',  text: 'text-green-800',  badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500',  label: 'تم التسليم' },
  'Refused on Delivery':  { bg: 'bg-red-50',    text: 'text-red-800',    badge: 'bg-red-100 text-red-700',      dot: 'bg-red-500',    label: 'مرفوض' },
  'Returned':             { bg: 'bg-rose-50',   text: 'text-rose-800',   badge: 'bg-rose-100 text-rose-700',    dot: 'bg-rose-400',   label: 'مرتجع' },
  'Cancelled':            { bg: 'bg-gray-50',   text: 'text-gray-600',   badge: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400',   label: 'ملغي' },
}

export const ALL_STATUSES = Object.keys(STATUS_COLORS)

export const SOURCES = ['Meta Ads','WhatsApp','Messenger','Instagram DM','Comment','Referral','Website','Repeat Customer']
export const GLASSES_TYPES = ['طبية رجالي','طبية نسائي','طبية أطفال','شمس رجالي','شمس نسائي','شمس أطفال']
export const LENS_TYPES = ['Blue Cut','Photochromic','Anti Reflective','Progressive','عادية','لم يحدد']
export const FRAME_TYPES = ['Full Frame','Half Frame','Rimless']
export const SHIPPING_COMPANIES = ['Bosta','Aramex','Courier','Internal Delivery','Other']
export const DELIVERY_RESULTS = ['تم التسليم','رفض الاستلام','غير متاح','مؤجل','مرتجع']
export const REFUSAL_REASONS = ['العميل غير متاح','رفض الاستلام','العنوان غير صحيح','تأخير الشحن','مشكلة في المنتج','سبب آخر']
export const PAYMENT_STATUSES = ['مدفوع','عند الاستلام','جزئي','لم يتم']

export const fmt = (n) => n == null ? '—' : Number(n).toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ج'
export const fmtPct = (n) => n == null ? '—' : (Number(n) * 100).toFixed(1) + '%'
export const today = () => new Date().toISOString().split('T')[0]
