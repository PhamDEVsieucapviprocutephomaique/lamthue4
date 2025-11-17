'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProductExport {
  id: string;
  export_code: string;
  order_code: string;
  store_name: string;
  store_code: string;
  export_type: string;
  total_amount: number;
  exported_by_name: string;
  export_date: string;
  received_status: string;
  received_by_name: string;
  received_at: string;
}

export default function ProductExportsPage() {
  const [exports, setExports] = useState<ProductExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'received'>('pending');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    setCurrentUser(JSON.parse(userStr));
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/product-exports');
      const data = await res.json();

      if (data.success) {
        setExports(data.exports);
      }
    } catch (error) {
      console.error('Error fetching exports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceive = async (exportId: string, exportCode: string) => {
    if (!confirm(`Xác nhận cửa hàng đã nhận hàng cho phiếu ${exportCode}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/product-exports/${exportId}/receive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          received_by: currentUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Có lỗi xảy ra');
        return;
      }

      alert('✅ Đã xác nhận nhận hàng!');
      await fetchData();
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
  };

  const pendingExports = exports.filter((e) => e.received_status === 'pending' && e.store_name);
  const receivedExports = exports.filter((e) => e.received_status === 'received' && e.store_name);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-900">Đang tải...</div>
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6">
      {/* Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Chờ xác nhận</div>
          <div className="text-3xl font-bold text-orange-600 mt-2">{pendingExports.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Đã nhận</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{receivedExports.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Tổng phiếu xuất</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{exports.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Xuất hàng cho cửa hàng</h2>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'pending'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Chờ xác nhận ({pendingExports.length})
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'received'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Đã nhận ({receivedExports.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã phiếu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cửa hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người xuất</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày xuất</th>
                {activeTab === 'received' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người nhận</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày nhận</th>
                  </>
                )}
                {activeTab === 'pending' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(activeTab === 'pending' ? pendingExports : receivedExports).map((exp) => (
                <tr key={exp.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {exp.export_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exp.order_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {exp.store_code} - {exp.store_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {exp.total_amount.toLocaleString()}đ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {exp.exported_by_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(exp.export_date).toLocaleString('vi-VN')}
                  </td>
                  {activeTab === 'received' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {exp.received_by_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {exp.received_at ? new Date(exp.received_at).toLocaleString('vi-VN') : '-'}
                      </td>
                    </>
                  )}
                  {activeTab === 'pending' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleConfirmReceive(exp.id, exp.export_code)}
                        className="text-green-600 hover:text-green-900 font-medium"
                      >
                        ✅ Xác nhận nhận
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {(activeTab === 'pending' ? pendingExports : receivedExports).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {activeTab === 'pending' ? 'Không có phiếu chờ xác nhận' : 'Chưa có phiếu đã nhận'}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
