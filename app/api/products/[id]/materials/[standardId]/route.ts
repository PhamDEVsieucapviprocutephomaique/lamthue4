import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; standardId: string }> }
) {
  try {
    const { standardId } = await params;
    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Vui lòng nhập số lượng hợp lệ' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE material_standards 
       SET quantity = $1
       WHERE id = $2
       RETURNING *`,
      [quantity, standardId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy định mức' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      standard: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating material standard:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật định mức' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; standardId: string }> }
) {
  try {
    const { standardId } = await params;

    const result = await pool.query('DELETE FROM material_standards WHERE id = $1 RETURNING id', [standardId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy định mức' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Xóa định mức thành công',
    });
  } catch (error) {
    console.error('Error deleting material standard:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa định mức' },
      { status: 500 }
    );
  }
}
