import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT p.*, 
       (SELECT COUNT(*) FROM material_standards WHERE product_id = p.id) as material_count
       FROM products p 
       ORDER BY p.created_at DESC`
    );

    return NextResponse.json({
      success: true,
      products: result.rows,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách sản phẩm' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, description, price, cost, product_type, status } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin bắt buộc' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO products (code, name, description, price, cost, product_type, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [code, name, description, price || 0, cost || 0, product_type || 'sỉ', status || 'active']
    );

    return NextResponse.json({
      success: true,
      product: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating product:', error);

    if (error.code === '23505') {
      return NextResponse.json({ error: 'Mã sản phẩm đã tồn tại' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo sản phẩm' },
      { status: 500 }
    );
  }
}
