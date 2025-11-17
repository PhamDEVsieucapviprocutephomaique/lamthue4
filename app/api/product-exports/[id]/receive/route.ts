import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { received_by } = body;

    await client.query('BEGIN');

    // Cập nhật trạng thái nhận hàng
    const updateResult = await client.query(
      `UPDATE product_exports
       SET received_status = 'received',
           received_by = $1,
           received_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [received_by, id]
    );

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy phiếu xuất' },
        { status: 404 }
      );
    }

    const productExport = updateResult.rows[0];

    console.log('Product Export:', productExport);
    console.log('Store ID:', productExport.store_id);

    // Lấy danh sách sản phẩm trong phiếu xuất
    const itemsResult = await client.query(
      `SELECT product_id, quantity
       FROM product_export_items
       WHERE product_export_id = $1`,
      [id]
    );

    console.log('Items to receive:', itemsResult.rows);

    // Cập nhật finished_products cho cửa hàng
    for (const item of itemsResult.rows) {
      console.log(`Processing item: product_id=${item.product_id}, quantity=${item.quantity}, store_id=${productExport.store_id}`);
      // Kiểm tra xem đã có record chưa
      const existingResult = await client.query(
        `SELECT id, quantity FROM finished_products
         WHERE product_id = $1 AND store_id = $2`,
        [item.product_id, productExport.store_id]
      );

      if (existingResult.rows.length > 0) {
        // Cập nhật số lượng
        console.log(`Updating existing: ${existingResult.rows[0].quantity} + ${item.quantity}`);
        await client.query(
          `UPDATE finished_products
           SET quantity = quantity + $1,
               updated_at = NOW()
           WHERE product_id = $2 AND store_id = $3`,
          [item.quantity, item.product_id, productExport.store_id]
        );
      } else {
        // Tạo mới
        console.log(`Creating new record for product ${item.product_id} in store ${productExport.store_id}`);
        await client.query(
          `INSERT INTO finished_products (product_id, quantity, store_id, batch_code, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [item.product_id, item.quantity, productExport.store_id, productExport.export_code]
        );
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Đã xác nhận nhận hàng và cập nhật kho cửa hàng',
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error confirming receive:', error);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra khi xác nhận nhận hàng' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
