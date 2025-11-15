'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    setCurrentUser(JSON.parse(userStr));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const menuItems = [
    {
      title: 'QUẢN LÝ XƯỞNG',
      items: [
        { name: 'Dashboard Xưởng', path: '/admin/dashboard', icon: '📊' },
        { name: 'Đơn hàng SX', path: '/admin/orders', icon: '📋' },
        { name: 'Sản phẩm', path: '/admin/products', icon: '👕' },
        { name: 'Nguyên vật liệu', path: '/admin/materials', icon: '🧵' },
        { name: 'Quy trình SX', path: '/admin/production', icon: '⚙️' },
        { name: 'Kho NVL', path: '/admin/warehouse/materials', icon: '📦' },
        { name: 'Kho thành phẩm', path: '/admin/warehouse/products', icon: '📦' },
      ],
    },
    {
      title: 'QUẢN LÝ CỬA HÀNG',
      items: [
        { name: 'Dashboard Cửa hàng', path: '/admin/store/dashboard', icon: '🏪' },
        { name: 'Bán hàng (POS)', path: '/admin/store/pos', icon: '💰' },
        { name: 'Kho cửa hàng', path: '/admin/store/warehouse', icon: '📦' },
        { name: 'Thu chi', path: '/admin/store/transactions', icon: '💵' },
      ],
    },
    {
      title: 'HỆ THỐNG',
      items: [
        { name: 'Khách hàng', path: '/admin/customers', icon: '👥' },
        { name: 'Nhà cung cấp', path: '/admin/suppliers', icon: '🏭' },
        { name: 'Người dùng', path: '/admin/users', icon: '👤' },
        { name: 'Tài chính', path: '/admin/finance', icon: '💳' },
        { name: 'Báo cáo', path: '/admin/reports', icon: '📈' },
      ],
    },
  ];

  const isActive = (path: string) => {
    if (path === '/admin/products' && pathname?.startsWith('/admin/products')) {
      return true;
    }
    return pathname === path;
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={`bg-gray-900 text-white transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {sidebarOpen && <h1 className="text-xl font-bold">Xưởng May</h1>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-800 rounded"
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((section, idx) => (
            <div key={idx} className="mb-6">
              {sidebarOpen && (
                <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase">
                  {section.title}
                </div>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`flex items-center px-4 py-2 hover:bg-gray-800 transition-colors ${
                        isActive(item.path) ? 'bg-blue-600 hover:bg-blue-700' : ''
                      }`}
                      title={!sidebarOpen ? item.name : ''}
                    >
                      <span className="text-xl">{item.icon}</span>
                      {sidebarOpen && <span className="ml-3 text-sm">{item.name}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-700">
          {sidebarOpen ? (
            <div>
              <div className="text-sm font-medium">{currentUser.fullName}</div>
              <div className="text-xs text-gray-400">{currentUser.role}</div>
              <button
                onClick={handleLogout}
                className="mt-2 w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full p-2 bg-red-600 hover:bg-red-700 rounded text-xl"
              title="Đăng xuất"
            >
              🚪
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
