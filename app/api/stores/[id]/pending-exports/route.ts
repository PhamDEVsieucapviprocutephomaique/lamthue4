import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Lấy danh sách phiếu xuất chờ nhận của cửa hàng
    const result = await pool.query(
      `SELECT 
        pe.id,
        pe.export_code,
        pe.export_date,
        pe.total_amount,
        o.order_code
       FROM product_exports pe
       LEFT JOIN orders o ON pe.order_id = o.id
       WHERE pe.store_id = $1 
         AND pe.received_status = 'pending'
       ORDER BY pe.export_date DESC`,
      [id]
    );

    // Lấy chi tiết sản phẩm cho từng phiếu xuất
    const exports = await Promise.all(
      result.rows.map(async (exp) => {
        const itemsResult = await pool.query(
          `SELECT 
            pei.quantity,
            p.code as product_code,
            p.name as product_name
           FROM product_export_items pei
           JOIN products p ON pei.product_id = p.id
           WHERE pei.product_export_id = $1`,
          [exp.id]
        );

        return {
          ...exp,
          items: itemsResult.rows,
        };
      })
    );

    return NextResponse.json({
      success: true,
      exports: exports,
    });
  } catch (error: any) {
    console.error('Error fetching pending exports:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải danh sách hàng chờ nhận' },
      { status: 500 }
    );
  }
}
