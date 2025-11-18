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
        id, sale_code, sale_date, total_amount, discount_amount, 
        final_amount, payment_method, payment_status
       FROM store_sales
       WHERE customer_id = $1
       ORDER BY sale_date DESC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      sales: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching customer sales:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải lịch sử mua hàng' },
      { status: 500 }
    );
  }
}
