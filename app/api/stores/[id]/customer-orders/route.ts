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
        sco.id,
        sco.order_code,
        sco.order_date,
        sco.required_date,
        sco.status,
        sco.total_amount,
        c.name as customer_name,
        c.phone as customer_phone,
        (SELECT COUNT(*) FROM store_customer_order_items WHERE store_customer_order_id = sco.id) as item_count
       FROM store_customer_orders sco
       JOIN customers c ON sco.customer_id = c.id
       WHERE sco.store_id = $1
       ORDER BY sco.created_at DESC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      orders: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching store customer orders:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải danh sách đơn hàng' },
      { status: 500 }
    );
  }
}
