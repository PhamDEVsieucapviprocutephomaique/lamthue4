import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT id, code, name, phone, email, address, tax_code, debt, store_id, created_at
       FROM customers 
       ORDER BY created_at DESC`
    );

    return NextResponse.json({
      success: true,
      customers: result.rows,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách khách hàng' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, phone, email, address, tax_code, store_id } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Chuyển store_id rỗng thành null
    const storeIdValue = store_id && store_id.trim() !== '' ? store_id : null;

    const result = await pool.query(
      `INSERT INTO customers (code, name, phone, email, address, tax_code, debt, store_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7, NOW())
       RETURNING *`,
      [code, name, phone, email, address, tax_code, storeIdValue]
    );

    return NextResponse.json({
      success: true,
      customer: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating customer:', error);

    if (error.code === '23505') {
      return NextResponse.json({ error: 'Mã khách hàng đã tồn tại' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo khách hàng' },
      { status: 500 }
    );
  }
}
