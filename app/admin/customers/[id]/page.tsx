'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  tax_code: string;
  debt: number;
  created_at: string;
}

interface Order {
  id: string;
  order_code: string;
  order_type: string;
  total_amount: number;
  debt_amount: number;
  status: string;
  item_count: number;
  created_at: string;
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'orders'>('info');
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const { id } = await params;
      
      const [customerRes, ordersRes] = await Promise.all([
        fetch(`/api/customers/${id}`),
        fetch(`/api/customers/${id}/factory-orders`),
      ]);

      const customerData = await customerRes.json();
      const ordersData = await ordersRes.json();

      if (customerData.success) {
        setCustomer(customerData.customer);
      }
      if (ordersData.success) {
        setOrders(ordersData.orders);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_production: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels: any = {
      pending: 'Chờ xử lý',
      confirmed: 'Đã xác nhận',
      in_production: 'Đang sản xuất',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalDebt = orders.reduce((sum, order) => sum + order.debt_amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-900">Đang tải...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-900">Không tìm thấy khách hàng</div>
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/customers"
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-sm text-gray-600">Mã KH: {customer.code} • Khách hàng xưởng</p>
          </div>
        </div>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Tổng đơn hàng</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{totalOrders}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Tổng giá trị</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {totalRevenue.toLocaleString()}đ
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Công nợ đơn hàng</div>
          <div className={`text-3xl font-bold mt-2 ${totalDebt > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
            {totalDebt.toLocaleString()}đ
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Công nợ tổng</div>
          <div className={`text-3xl font-bold mt-2 ${customer.debt > 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {customer.debt.toLocaleString()}đ
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'info'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Thông tin
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'orders'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Đơn hàng sản xuất ({totalOrders})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Mã khách hàng</div>
                    <div className="font-medium text-gray-900">{customer.code}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Tên khách hàng</div>
                    <div className="font-medium text-gray-900">{customer.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Số điện thoại</div>
                    <div className="font-medium text-gray-900">{customer.phone}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="font-medium text-gray-900">{customer.email || '-'}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khác</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Địa chỉ</div>
                    <div className="font-medium text-gray-900">{customer.address || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Mã số thuế</div>
                    <div className="font-medium text-gray-900">{customer.tax_code || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Ngày tạo</div>
                    <div className="font-medium text-gray-900">
                      {new Date(customer.created_at).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử đơn hàng sản xuất</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SP</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Công nợ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.order_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.order_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.item_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.total_amount.toLocaleString()}đ
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={order.debt_amount > 0 ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                            {order.debt_amount.toLocaleString()}đ
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(order.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Chi tiết
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {orders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">Chưa có đơn hàng nào</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
