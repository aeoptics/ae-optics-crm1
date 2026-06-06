# 👓 AE Optics CRM

نظام إدارة طلبات متجر النظارات الأونلاين — مبني بـ React + Supabase + GitHub Pages

---

## 🚀 خطوات الإعداد الكاملة

### الخطوة 1 — إنشاء قاعدة البيانات (Supabase)

1. اذهب إلى [supabase.com](https://supabase.com) وأنشئ حساباً مجانياً
2. اضغط **New Project** وأدخل اسم المشروع: `ae-optics-crm`
3. بعد إنشاء المشروع، اذهب إلى **SQL Editor**
4. انسخ كامل محتوى ملف `supabase_schema.sql` والصقه واضغط **Run**
5. من قائمة **Project Settings > API** انسخ:
   - `Project URL` → هذا هو `VITE_SUPABASE_URL`
   - `anon public key` → هذا هو `VITE_SUPABASE_ANON_KEY`

### الخطوة 2 — إنشاء أول مستخدم (Admin)

1. في Supabase اذهب إلى **Authentication > Users**
2. اضغط **Add User** وأدخل إيميلك وكلمة مرور قوية
3. هذا المستخدم هو المدير الأول للنظام

### الخطوة 3 — رفع الكود على GitHub

```bash
# 1. أنشئ Repository جديد على github.com اسمه: ae-optics-crm
# 2. ابدأ Git في المجلد

git init
git add .
git commit -m "Initial commit: AE Optics CRM"
git remote add origin https://github.com/YOUR_USERNAME/ae-optics-crm.git
git push -u origin main
```

### الخطوة 4 — إضافة Secrets على GitHub

1. في GitHub Repository اذهب إلى **Settings > Secrets and Variables > Actions**
2. اضغط **New repository secret** وأضف:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | قيمة Project URL من Supabase |
| `VITE_SUPABASE_ANON_KEY` | قيمة anon key من Supabase |

### الخطوة 5 — تفعيل GitHub Pages

1. في GitHub Repository اذهب إلى **Settings > Pages**
2. في **Source** اختر **GitHub Actions**
3. ارفع أي تعديل صغير أو اضغط **Actions > Run workflow**
4. بعد دقيقة، الموقع يكون متاح على:
   ```
   https://YOUR_USERNAME.github.io/ae-optics-crm/
   ```

---

## 📱 المميزات

- **Dashboard** — لوحة تحكم مع KPIs تلقائية وشارتات
- **Orders** — إدارة الطلبات مع تلوين الصفوف حسب الحالة
- **Workshop** — حسابات الورشة والمستحقات
- **Inventory** — مخزون الفريمات مع تنبيه الكميات المنخفضة
- **Customers** — أرشيف العملاء
- **Revenue** — تحليل الإيرادات والربحية
- **Settings** — إعدادات التسعير وإدارة الفريق

---

## 🔒 الأمان

- المصادقة عبر Supabase Auth (إيميل + كلمة مرور)
- Row Level Security مفعّل على كل الجداول
- المفاتيح السرية تُخزّن في GitHub Secrets (لا تظهر في الكود)

---

## 🛠️ التطوير المحلي

```bash
# 1. انسخ ملف المتغيرات
cp .env.example .env.local

# 2. عدّل القيم في .env.local
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...

# 3. شغّل
npm install
npm run dev
```

---

## 📂 هيكل المشروع

```
ae-optics-crm/
├── src/
│   ├── components/
│   │   ├── Layout.jsx        # الصفحة الرئيسية والـ Sidebar
│   │   └── OrderForm.jsx     # فورم إضافة/تعديل الطلبات
│   ├── pages/
│   │   ├── Dashboard.jsx     # لوحة التحكم
│   │   ├── Orders.jsx        # الطلبات
│   │   ├── Workshop.jsx      # الورشة
│   │   ├── Inventory.jsx     # المخزون
│   │   ├── Customers.jsx     # العملاء
│   │   ├── Revenue.jsx       # الإيرادات
│   │   ├── Settings.jsx      # الإعدادات
│   │   └── Login.jsx         # تسجيل الدخول
│   ├── hooks/
│   │   └── useAuth.jsx       # نظام المصادقة
│   ├── lib/
│   │   └── supabase.js       # إعدادات Supabase والثوابت
│   └── index.css             # التصميم
├── supabase_schema.sql        # قاعدة البيانات
├── .github/workflows/
│   └── deploy.yml            # Auto-deploy CI/CD
└── .env.example              # نموذج المتغيرات
```
