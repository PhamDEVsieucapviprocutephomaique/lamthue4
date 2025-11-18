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
        id, code, name, phone, email, address, tax_code, debt, store_id, created_at
       FROM customers
       WHERE store_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      customers: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching store customers:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải danh sách khách hàng' },
      { status: 500 }
    );
  }
}
