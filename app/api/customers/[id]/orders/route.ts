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
        id, order_code, order_date, required_date, status, total_amount,
        (SELECT COUNT(*) FROM store_customer_order_items WHERE store_customer_order_id = store_customer_orders.id) as item_count
       FROM store_customer_orders
       WHERE customer_id = $1
       ORDER BY order_date DESC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      orders: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải lịch sử đơn hàng' },
      { status: 500 }
    );
  }
}
