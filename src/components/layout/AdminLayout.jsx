import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { toasts, toast } = useToast()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <div className="flex-shrink-0 h-full">
        <Sidebar collapsed={collapsed} />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuToggle={() => setCollapsed((c) => !c)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-[1400px] mx-auto">
            <Outlet context={{ toast }} />
          </div>
        </main>
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  )
}

export default AdminLayout
