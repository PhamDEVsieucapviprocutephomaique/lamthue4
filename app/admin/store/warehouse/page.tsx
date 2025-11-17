'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Store {
  id: string;
  code: string;
  name: string;
  address: string;
}

interface StoreInventory {
  product_id: string;
  product_code: string;
  product_name: string;
  total_quantity: number;
  price: number;
}

interface Product {
  status: string;
  id: string;
  code: string;
  name: string;
  price: number;
}

interface PendingExport {
  id: string;
  export_code: string;
  order_code: string;
  export_date: string;
  total_amount: number;
  items: {
    product_code: string;
    product_name: string;
    quantity: number;
  }[];
}

export default function StoreWarehousePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [inventory, setInventory] = useState<StoreInventory[]>([]);
  const [pendingExports, setPendingExports] = useState<PendingExport[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'pending'>('inventory');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderItems, setOrderItems] = useState<{ product_id: string; quantity: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    setCurrentUser(JSON.parse(userStr));
    fetchStores();
  }, [router]);

  useEffect(() => {
    if (selectedStoreId) {
      fetchInventory();
      fetchPendingExports();
    }
  }, [selectedStoreId]);

  const fetchStores = async () => {
    try {
      const [storesRes, productsRes] = await Promise.all([
        fetch('/api/stores'),
        fetch('/api/products'),
      ]);

      const storesData = await storesRes.json();
      const productsData = await productsRes.json();

      if (storesData.success) {
        setStores(storesData.stores);
        if (storesData.stores.length > 0) {
          setSelectedStoreId(storesData.stores[0].id);
        }
      }
      if (productsData.success) {
        setProducts(productsData.products.filter((p: Product) => p.status === 'active'));
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    if (!selectedStoreId) return;

    try {
      const res = await fetch(`/api/stores/${selectedStoreId}/inventory`);
      const data = await res.json();

      if (data.success) {
        setInventory(data.inventory);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchPendingExports = async () => {
    if (!selectedStoreId) return;

    try {
      const res = await fetch(`/api/stores/${selectedStoreId}/pending-exports`);
      const data = await res.json();

      if (data.success) {
        setPendingExports(data.exports);
      }
    } catch (error) {
      console.error('Error fetching pending exports:', error);
    }
  };

  const handleConfirmReceive = async (exportId: string, exportCode: string) => {
    if (!confirm(`Xác nhận đã nhận hàng cho phiếu ${exportCode}?`)) {
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

      alert('✅ Đã xác nhận nhận hàng và cập nhật kho!');
      await fetchInventory();
      await fetchPendingExports();
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
  };

  const openOrderForm = () => {
    setOrderItems([{ product_id: '', quantity: 1 }]);
    setShowOrderForm(true);
  };

  const closeOrderForm = () => {
    setShowOrderForm(false);
    setOrderItems([]);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  };

  const handleCreateOrder = async () => {
    if (!selectedStoreId || orderItems.length === 0) {
      alert('Vui lòng chọn cửa hàng và thêm sản phẩm');
      return;
    }

    if (orderItems.some((item) => !item.product_id || item.quantity <= 0)) {
      alert('Vui lòng nhập đầy đủ thông tin sản phẩm');
      return;
    }

    if (!confirm('Tạo đơn hàng sản xuất cho cửa hàng này?')) {
      return;
    }

    setSubmitting(true);

    try {
      const orderCode = `ORD-${Date.now().toString().slice(-8)}`;
      
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_code: orderCode,
          store_id: selectedStoreId,
          order_type: 'sỉ',
          items: orderItems.map((item) => {
            const product = products.find((p) => p.id === item.product_id);
            return {
              product_id: item.product_id,
              quantity: item.quantity,
              price: product?.price || 0,
            };
          }),
          created_by: currentUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Có lỗi xảy ra');
        return;
      }

      alert('✅ Tạo đơn hàng thành công!');
      closeOrderForm();
    } catch (error) {
      alert('Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStore = stores.find((s) => s.id === selectedStoreId);
  const totalValue = inventory.reduce((sum, item) => sum + item.total_quantity * item.price, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-900">Đang tải...</div>
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6">
      {/* Modal tạo đơn hàng */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-blue-600 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">
                Tạo đơn hàng sản xuất - {selectedStore?.name}
              </h3>
              <button
                onClick={closeOrderForm}
                className="text-white hover:text-gray-200 text-2xl font-bold"
                disabled={submitting}
              >
                ×
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">Sản phẩm cần sản xuất</h4>
                  <button
                    type="button"
                    onClick={addOrderItem}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    + Thêm sản phẩm
                  </button>
                </div>

                {orderItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-8">
                      <select
                        value={item.product_id}
                        onChange={(e) => updateOrderItem(index, 'product_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm"
                        required
                      >
                        <option value="">-- Chọn sản phẩm --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        placeholder="Số lượng"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm"
                        required
                      />
                    </div>
                    <div className="col-span-1 flex items-center">
                      <button
                        type="button"
                        onClick={() => removeOrderItem(index)}
                        className="text-red-600 hover:text-red-900 text-xl"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeOrderForm}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-gray-700 font-medium"
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateOrder}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                  disabled={submitting}
                >
                  {submitting ? 'Đang tạo...' : 'Tạo đơn hàng'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Kho cửa hàng</h2>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.code} - {store.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={openOrderForm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Tạo đơn hàng SX
          </button>
        </div>

        {selectedStore && (
          <div className="mt-4 text-sm text-gray-600">
            <div>Địa chỉ: {selectedStore.address}</div>
          </div>
        )}
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Chờ nhận hàng</div>
          <div className="text-3xl font-bold text-orange-600 mt-2">{pendingExports.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Tổng số sản phẩm</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{inventory.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Tổng số lượng</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {inventory.reduce((sum, item) => sum + item.total_quantity, 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Giá trị tồn kho</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">
            {totalValue.toLocaleString()}đ
          </div>
        </div>
      </div>

      {/* Tabs và danh sách */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'inventory'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tồn kho ({inventory.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'pending'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Chờ nhận hàng ({pendingExports.length})
            </button>
          </div>
        </div>

        {activeTab === 'inventory' && (
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã SP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn giá</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá trị</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item) => (
                <tr key={item.product_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.product_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.product_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {item.total_quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.price.toLocaleString()}đ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {(item.total_quantity * item.price).toLocaleString()}đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

            {inventory.length === 0 && (
              <div className="text-center py-8 text-gray-500">Kho trống</div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hàng đang chờ nhận từ xưởng</h3>
            <div className="space-y-4">
              {pendingExports.map((exp) => (
                <div key={exp.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm text-gray-600">Mã phiếu xuất</div>
                      <div className="font-semibold text-gray-900">{exp.export_code}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Đơn hàng</div>
                      <div className="font-semibold text-gray-900">{exp.order_code}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Ngày xuất</div>
                      <div className="font-semibold text-gray-900">
                        {new Date(exp.export_date).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Tổng tiền</div>
                      <div className="font-semibold text-gray-900">{exp.total_amount.toLocaleString()}đ</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">Danh sách sản phẩm:</div>
                    <div className="space-y-1">
                      {exp.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                          <span className="text-gray-900">
                            {item.product_code} - {item.product_name}
                          </span>
                          <span className="font-semibold text-gray-900">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleConfirmReceive(exp.id, exp.export_code)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                    >
                      ✅ Xác nhận đã nhận hàng
                    </button>
                  </div>
                </div>
              ))}

              {pendingExports.length === 0 && (
                <div className="text-center py-8 text-gray-500">Không có hàng chờ nhận</div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
