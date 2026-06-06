import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Workshop from './pages/Workshop'
import Inventory from './pages/Inventory'
import Customers from './pages/Customers'
import Revenue from './pages/Revenue'
import Settings from './pages/Settings'
import DeliveryTracker from './pages/DeliveryTracker'
import Expenses from './pages/Expenses'
import Employees from './pages/Employees'
import ShippingSettings from './pages/ShippingSettings'
import { AuthProvider } from './hooks/useAuth'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter basename="/ae-optics-crm1">
        <Routes>
          <Route path="/" element={<Layout/>}>
            <Route index element={<Dashboard/>}/>
            <Route path="orders" element={<Orders/>}/>
            <Route path="tracker" element={<DeliveryTracker/>}/>
            <Route path="workshop" element={<Workshop/>}/>
            <Route path="inventory" element={<Inventory/>}/>
            <Route path="customers" element={<Customers/>}/>
            <Route path="revenue" element={<Revenue/>}/>
            <Route path="expenses" element={<Expenses/>}/>
            <Route path="employees" element={<Employees/>}/>
            <Route path="shipping" element={<ShippingSettings/>}/>
            <Route path="settings" element={<Settings/>}/>
          </Route>
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)
