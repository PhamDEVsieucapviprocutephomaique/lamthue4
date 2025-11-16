import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Lấy thông tin đơn hàng
    const orderResult = await pool.query(
      `SELECT o.*, 
              c.name as customer_name, c.code as customer_code, c.phone as customer_phone,
              u.full_name as created_by_name
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN users u ON o.created_by = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    // Lấy chi tiết sản phẩm
    const itemsResult = await pool.query(
      `SELECT oi.*, p.code as product_code, p.name as product_name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    // Lấy tiến độ sản xuất
    const processResult = await pool.query(
      `SELECT * FROM production_process 
       WHERE order_id = $1 
       ORDER BY created_at`,
      [id]
    );

    return NextResponse.json({
      success: true,
      order: orderResult.rows[0],
      items: itemsResult.rows,
      processes: processResult.rows,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thông tin đơn hàng' },
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

    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING order_code', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Xóa đơn hàng thành công',
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa đơn hàng' },
      { status: 500 }
    );
  }
}
