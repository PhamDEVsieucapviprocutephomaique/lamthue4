import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const result = await pool.query(
      `SELECT 
        o.id, o.order_code, o.order_type, o.total_amount, o.debt_amount, 
        o.status, o.created_at,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
       FROM orders o
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      orders: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching factory orders:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải lịch sử đơn hàng' },
      { status: 500 }
    );
  }
}
