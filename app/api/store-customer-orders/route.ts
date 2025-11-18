import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const body = await request.json();
    const { store_id, customer_id, required_date, notes, items, created_by } = body;

    if (!store_id || !customer_id || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin' },
        { status: 400 }
      );
    }

    // Tạo mã đơn hàng
    const order_code = `SCO-${Date.now().toString().slice(-8)}`;

    // Tính tổng tiền
    const total_amount = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unit_price,
      0
    );

    // Tạo đơn hàng
    const orderResult = await client.query(
      `INSERT INTO store_customer_orders 
       (order_code, store_id, customer_id, order_date, required_date, status, total_amount, notes, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), $4, 'pending', $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [order_code, store_id, customer_id, required_date || null, total_amount, notes, created_by]
    );

    const order = orderResult.rows[0];

    // Thêm chi tiết đơn hàng
    for (const item of items) {
      await client.query(
        `INSERT INTO store_customer_order_items 
         (store_customer_order_id, product_id, quantity, unit_price, stock_status, created_at)
         VALUES ($1, $2, $3, $4, 'checking', NOW())`,
        [order.id, item.product_id, item.quantity, item.unit_price]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      order: order,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating store customer order:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo đơn hàng' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
