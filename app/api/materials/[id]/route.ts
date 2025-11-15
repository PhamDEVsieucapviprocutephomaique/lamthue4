import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, unit, current_stock, min_stock, price, status } = body;

    if (!name || !unit) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin bắt buộc' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE materials 
       SET name = $1, unit = $2, current_stock = $3, min_stock = $4, price = $5, status = $6
       WHERE id = $7
       RETURNING *`,
      [name, unit, current_stock, min_stock, price, status, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy NVL' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      material: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating material:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật NVL' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query('DELETE FROM materials WHERE id = $1 RETURNING name', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy NVL' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Xóa NVL thành công',
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa NVL' },
      { status: 500 }
    );
  }
}
