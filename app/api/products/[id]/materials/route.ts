import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `SELECT ms.id, ms.material_id, ms.quantity, ms.unit,
              m.code as material_code, m.name as material_name
       FROM material_standards ms
       JOIN materials m ON ms.material_id = m.id
       WHERE ms.product_id = $1
       ORDER BY m.code`,
      [id]
    );

    return NextResponse.json({
      success: true,
      standards: result.rows,
    });
  } catch (error) {
    console.error('Error fetching material standards:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách định mức' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { material_id, quantity } = body;

    if (!material_id || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin hợp lệ' },
        { status: 400 }
      );
    }

    // Lấy đơn vị từ material
    const materialResult = await pool.query('SELECT unit FROM materials WHERE id = $1', [material_id]);

    if (materialResult.rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy NVL' }, { status: 404 });
    }

    const unit = materialResult.rows[0].unit;

    const result = await pool.query(
      `INSERT INTO material_standards (product_id, material_id, quantity, unit, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [id, material_id, quantity, unit]
    );

    return NextResponse.json({
      success: true,
      standard: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating material standard:', error);

    if (error.code === '23505') {
      return NextResponse.json({ error: 'NVL này đã có định mức cho sản phẩm' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo định mức' },
      { status: 500 }
    );
  }
}
