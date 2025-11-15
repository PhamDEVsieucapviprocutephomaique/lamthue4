import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, price, cost, product_type, status } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin bắt buộc' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE products 
       SET name = $1, description = $2, price = $3, cost = $4, product_type = $5, status = $6
       WHERE id = $7
       RETURNING *`,
      [name, description, price, cost, product_type, status, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy sản phẩm' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật sản phẩm' },
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

    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING name', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy sản phẩm' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Xóa sản phẩm thành công',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa sản phẩm' },
      { status: 500 }
    );
  }
}
