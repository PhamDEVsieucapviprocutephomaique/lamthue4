import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query('SELECT id, code, name FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy sản phẩm' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thông tin sản phẩm' },
      { status: 500 }
    );
  }
}
