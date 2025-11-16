import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, email, address, tax_code } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin bắt buộc' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE customers 
       SET name = $1, phone = $2, email = $3, address = $4, tax_code = $5
       WHERE id = $6
       RETURNING *`,
      [name, phone, email, address, tax_code, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy khách hàng' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      customer: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật khách hàng' },
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

    const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING name', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy khách hàng' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Xóa khách hàng thành công',
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa khách hàng' },
      { status: 500 }
    );
  }
}
