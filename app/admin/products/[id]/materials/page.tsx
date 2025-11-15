'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: string;
  code: string;
  name: string;
}

interface Material {
  id: string;
  code: string;
  name: string;
  unit: string;
  status: string;
}

interface MaterialStandard {
  id: string;
  material_id: string;
  material_code: string;
  material_name: string;
  quantity: number;
  unit: string;
}

interface StandardFormData {
  material_id: string;
  quantity: number;
}

export default function ProductMaterialsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [standards, setStandards] = useState<MaterialStandard[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStandard, setEditingStandard] = useState<MaterialStandard | null>(null);
  const [formData, setFormData] = useState<StandardFormData>({
    material_id: '',
    quantity: 0,
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router, productId]);

  const fetchData = async () => {
    try {
      const [productRes, standardsRes, materialsRes] = await Promise.all([
        fetch(`/api/products/${productId}/info`),
        fetch(`/api/products/${productId}/materials`),
        fetch('/api/materials'),
      ]);

      const productData = await productRes.json();
      const standardsData = await standardsRes.json();
      const materialsData = await materialsRes.json();

      if (productData.success) setProduct(productData.product);
      if (standardsData.success) setStandards(standardsData.standards);
      if (materialsData.success) setMaterials(materialsData.materials.filter((m: Material) => m.status === 'active'));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingStandard(null);
    setFormData({
      material_id: '',
      quantity: 0,
    });
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (standard: MaterialStandard) => {
    setEditingStandard(standard);
    setFormData({
      material_id: standard.material_id,
      quantity: standard.quantity,
    });
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingStandard(null);
    setFormError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' ? parseFloat(value) || 0 : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const url = editingStandard
        ? `/api/products/${productId}/materials/${editingStandard.id}`
        : `/api/products/${productId}/materials`;
      const method = editingStandard ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Có lỗi xảy ra');
        setSubmitting(false);
        return;
      }

      await fetchData();
      closeForm();
    } catch (error) {
      setFormError('Có lỗi xảy ra khi lưu dữ liệu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, materialName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa định mức "${materialName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${productId}/materials/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Có lỗi xảy ra khi xóa');
        return;
      }

      await fetchData();
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa định mức');
    }
  };

  const selectedMaterial = materials.find((m) => m.id === formData.material_id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-900">Đang tải...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-900">Không tìm thấy sản phẩm</div>
      </div>
    );
  }

  return (
    <>
      <header className="bg-white shadow">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/products" className="text-blue-600 hover:text-blue-900">
              ← Quay lại
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Định mức NVL</h1>
              <p className="text-sm text-gray-600">
                Sản phẩm: {product.code} - {product.name}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg border-2 border-blue-500">
            <div className="px-6 py-4 bg-blue-600 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">
                {editingStandard ? 'Sửa định mức' : 'Thêm định mức NVL'}
              </h3>
              <button
                onClick={closeForm}
                className="text-white hover:text-gray-200 text-2xl font-bold"
                disabled={submitting}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nguyên vật liệu <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="material_id"
                    value={formData.material_id}
                    onChange={handleInputChange}
                    disabled={!!editingStandard}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white disabled:bg-gray-100"
                    required
                  >
                    <option value="">-- Chọn NVL --</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.code} - {material.name} ({material.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số lượng <span className="text-red-500">*</span>
                    {selectedMaterial && (
                      <span className="text-gray-500 text-xs ml-2">({selectedMaterial.unit})</span>
                    )}
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    required
                  />
                </div>
              </div>

              {formError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{formError}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-gray-700 font-medium"
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                  disabled={submitting}
                >
                  {submitting ? 'Đang lưu...' : editingStandard ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Danh sách định mức NVL</h2>
            <button
              onClick={openAddForm}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Thêm định mức
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã NVL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên NVL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn vị</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {standards.map((standard) => (
                  <tr key={standard.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {standard.material_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standard.material_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {standard.quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standard.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => openEditForm(standard)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(standard.id, standard.material_name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {standards.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Chưa có định mức NVL nào. Hãy thêm định mức để tính toán NVL cần thiết khi sản xuất.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
