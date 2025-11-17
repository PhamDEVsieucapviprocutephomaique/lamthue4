import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const result = await pool.query(`
      SELECT 
        p.id as product_id,
        p.code as product_code,
        p.name as product_name,
        COALESCE(SUM(fp.quantity), 0) as total_quantity,
        p.price
      FROM products p
      LEFT JOIN finished_products fp ON fp.product_id = p.id AND fp.store_id = $1
      WHERE p.status = 'active'
      GROUP BY p.id, p.code, p.name, p.price
      ORDER BY p.code
    `, [id]);

    return NextResponse.json({
      success: true,
      inventory: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching store inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải tồn kho cửa hàng' },
      { status: 500 }
    );
  }
}
