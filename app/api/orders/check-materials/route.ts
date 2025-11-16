import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body; // items: [{ product_id, quantity }]

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng chọn sản phẩm' },
        { status: 400 }
      );
    }

    const materialCheck = [];

    for (const item of items) {
      // Lấy định mức NVL của sản phẩm
      const standardsResult = await pool.query(
        `SELECT ms.*, m.code as material_code, m.name as material_name, 
                m.current_stock, m.unit
         FROM material_standards ms
         JOIN materials m ON ms.material_id = m.id
         WHERE ms.product_id = $1`,
        [item.product_id]
      );

      const standards = standardsResult.rows;

      // Tính NVL cần thiết
      for (const standard of standards) {
        const required = standard.quantity * item.quantity;
        const available = standard.current_stock;
        const shortage = Math.max(0, required - available);

        const existingIndex = materialCheck.findIndex(
          (m) => m.material_id === standard.material_id
        );

        if (existingIndex >= 0) {
          materialCheck[existingIndex].required += required;
          materialCheck[existingIndex].shortage = Math.max(
            0,
            materialCheck[existingIndex].required - available
          );
        } else {
          materialCheck.push({
            material_id: standard.material_id,
            material_code: standard.material_code,
            material_name: standard.material_name,
            unit: standard.unit,
            required: required,
            available: available,
            shortage: shortage,
            is_sufficient: shortage === 0,
          });
        }
      }
    }

    const allSufficient = materialCheck.every((m) => m.is_sufficient);

    return NextResponse.json({
      success: true,
      is_sufficient: allSufficient,
      materials: materialCheck,
    });
  } catch (error) {
    console.error('Error checking materials:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi kiểm tra NVL' },
      { status: 500 }
    );
  }
}
