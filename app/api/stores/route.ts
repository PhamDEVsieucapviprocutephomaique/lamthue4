import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT id, code, name, address, phone, manager_name, revenue, is_franchise, created_at
      FROM stores
      ORDER BY code
    `);

    return NextResponse.json({
      success: true,
      stores: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải danh sách cửa hàng' },
      { status: 500 }
    );
  }
}
