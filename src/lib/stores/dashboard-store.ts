import { create } from 'zustand'

// ============================================
// Types
// ============================================

export interface Outlet {
  id: string
  name: string
  location: string
  mapsUrl: string
  status: 'online' | 'offline' | 'error'
  features: {
    qris: boolean
    voucher: boolean
    cashless: boolean
  }
  lastHeartbeat: string
  createdAt: string
}

export interface Template {
  id: string
  name: string
  category: '4R' | 'A4 Newspaper' | 'GIF' | 'Custom'
  imageUrl: string
  price: number
  isActive: boolean
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'owner' | 'manager' | 'staff'
  outletId?: string
  status: 'active' | 'inactive'
  createdAt: string
}

export interface Voucher {
  id: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minPurchase: number
  maxDiscount?: number
  usageLimit: number
  usedCount: number
  validFrom: string
  validUntil: string
  isActive: boolean
  createdAt: string
}

export interface Testimonial {
  id: string
  customerName: string
  rating: number
  comment: string
  outletId: string
  isApproved: boolean
  createdAt: string
}

export interface Branding {
  logoUrl: string
  primaryColor: string
  secondaryColor: string
  heroBannerUrl: string
  companyName: string
  tagline: string
}

export interface Transaction {
  id: string
  outletId: string
  amount: number
  status: 'success' | 'pending' | 'failed'
  paymentMethod: string
  createdAt: string
}

export interface BoothStatus {
  id: string
  name: string
  outletId: string
  status: 'online' | 'offline' | 'error'
  lastPhoto: string
}

// ============================================
// Dashboard Store
// ============================================

interface DashboardState {
  refreshDashboard: () => Promise<void>
  refreshPublic: () => Promise<void>
  photosToday: number
  // Data
  outlets: Outlet[]
  templates: Template[]
  users: User[]
  vouchers: Voucher[]
  testimonials: Testimonial[]
  branding: Branding
  transactions: Transaction[]
  boothStatuses: BoothStatus[]
  
  // UI State
  darkMode: boolean
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  activeModule: string
  searchQuery: string
  
  // Actions - Outlets
  addOutlet: (outlet: Omit<Outlet, 'id' | 'createdAt'>) => void
  updateOutlet: (id: string, data: Partial<Outlet>) => void
  deleteOutlet: (id: string) => void
  
  // Actions - Templates
  addTemplate: (template: Omit<Template, 'id' | 'createdAt'>) => void
  updateTemplate: (id: string, data: Partial<Template>) => void
  deleteTemplate: (id: string) => void
  
  // Actions - Users
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void
  updateUser: (id: string, data: Partial<User>) => void
  deleteUser: (id: string) => void
  
  // Actions - Vouchers
  addVoucher: (voucher: Omit<Voucher, 'id' | 'createdAt' | 'code' | 'usedCount'>) => void
  updateVoucher: (id: string, data: Partial<Voucher>) => void
  deleteVoucher: (id: string) => void
  
  // Actions - Testimonials
  addTestimonial: (testimonial: Omit<Testimonial, 'id' | 'createdAt'>) => void
  updateTestimonial: (id: string, data: Partial<Testimonial>) => void
  deleteTestimonial: (id: string) => void
  
  // Actions - Branding
  updateBranding: (data: Partial<Branding>) => void
  
  // Actions - UI
  toggleDarkMode: () => void
  toggleSidebar: () => void
  toggleSidebarCollapsed: () => void
  setActiveModule: (module: string) => void
  setSearchQuery: (query: string) => void
}

// ============================================
// Default branding
// ============================================

const defaultBranding: Branding = {
  logoUrl: '',
  primaryColor: '#a855f7',
  secondaryColor: '#ec4899',
  heroBannerUrl: '',
  companyName: 'SnapNext',
  tagline: 'Capture Your Moments'
}

// ============================================
// Helper Functions
// ============================================

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// ============================================
// Store
// ============================================

export const useDashboardStore = create<DashboardState>((set) => ({
  photosToday: 0,
  refreshDashboard: async () => {
    const response = await fetch('/api/admin/dashboard')
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Gagal memuat dashboard')
    set(result.data)
  },
  refreshPublic: async () => {
    const response = await fetch('/api/public/site')
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Gagal memuat data situs')
    set(result.data)
  },
  // Initial Data
  outlets: [],
  templates: [],
  users: [],
  vouchers: [],
  testimonials: [],
  branding: defaultBranding,
  transactions: [],
  boothStatuses: [],
  
  // Initial UI State
  darkMode: false,
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeModule: 'dashboard',
  searchQuery: '',
  
  // Outlets Actions
  addOutlet: (outlet) => set((state) => ({
    outlets: [...state.outlets, { ...outlet, id: generateId(), createdAt: new Date().toISOString() }]
  })),
  
  updateOutlet: (id, data) => set((state) => ({
    outlets: state.outlets.map((o) => (o.id === id ? { ...o, ...data } : o))
  })),
  
  deleteOutlet: (id) => set((state) => ({
    outlets: state.outlets.filter((o) => o.id !== id)
  })),
  
  // Templates Actions
  addTemplate: (template) => set((state) => ({
    templates: [...state.templates, { ...template, id: generateId(), createdAt: new Date().toISOString() }]
  })),
  
  updateTemplate: (id, data) => set((state) => ({
    templates: state.templates.map((t) => (t.id === id ? { ...t, ...data } : t))
  })),
  
  deleteTemplate: (id) => set((state) => ({
    templates: state.templates.filter((t) => t.id !== id)
  })),
  
  // Users Actions
  addUser: (user) => set((state) => ({
    users: [...state.users, { ...user, id: generateId(), createdAt: new Date().toISOString() }]
  })),
  
  updateUser: (id, data) => set((state) => ({
    users: state.users.map((u) => (u.id === id ? { ...u, ...data } : u))
  })),
  
  deleteUser: (id) => set((state) => ({
    users: state.users.filter((u) => u.id !== id)
  })),
  
  // Vouchers Actions
  addVoucher: (voucher) => set((state) => ({
    vouchers: [...state.vouchers, { 
      ...voucher, 
      id: generateId(), 
      code: generateVoucherCode(),
      usedCount: 0,
      createdAt: new Date().toISOString() 
    }]
  })),
  
  updateVoucher: (id, data) => set((state) => ({
    vouchers: state.vouchers.map((v) => (v.id === id ? { ...v, ...data } : v))
  })),
  
  deleteVoucher: (id) => set((state) => ({
    vouchers: state.vouchers.filter((v) => v.id !== id)
  })),
  
  // Testimonials Actions
  addTestimonial: (testimonial) => set((state) => ({
    testimonials: [...state.testimonials, { ...testimonial, id: generateId(), createdAt: new Date().toISOString() }]
  })),
  
  updateTestimonial: (id, data) => set((state) => ({
    testimonials: state.testimonials.map((t) => (t.id === id ? { ...t, ...data } : t))
  })),
  
  deleteTestimonial: (id) => set((state) => ({
    testimonials: state.testimonials.filter((t) => t.id !== id)
  })),
  
  // Branding Actions
  updateBranding: (data) => set((state) => ({
    branding: { ...state.branding, ...data }
  })),
  
  // UI Actions
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setActiveModule: (module) => set({ activeModule: module }),
  setSearchQuery: (query) => set({ searchQuery: query })
}))
