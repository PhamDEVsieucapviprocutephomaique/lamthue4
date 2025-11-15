import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT m.*, s.name as supplier_name 
       FROM materials m 
       LEFT JOIN suppliers s ON m.supplier_id = s.id 
       ORDER BY m.created_at DESC`
    );

    return NextResponse.json({
      success: true,
      materials: result.rows,
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách NVL' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, unit, current_stock, min_stock, price, status } = body;

    if (!code || !name || !unit) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin bắt buộc' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO materials (code, name, unit, current_stock, min_stock, price, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [code, name, unit, current_stock || 0, min_stock || 0, price || 0, status || 'active']
    );

    return NextResponse.json({
      success: true,
      material: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating material:', error);

    if (error.code === '23505') {
      return NextResponse.json({ error: 'Mã NVL đã tồn tại' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo NVL' },
      { status: 500 }
    );
  }
}
