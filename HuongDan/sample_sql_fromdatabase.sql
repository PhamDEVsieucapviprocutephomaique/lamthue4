-- Bảng Nhà cung cấp
CREATE TABLE suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    tax_code VARCHAR(50),
    debt DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Nguyên vật liệu
CREATE TABLE materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    current_stock DECIMAL(10,2) DEFAULT 0,
    min_stock DECIMAL(10,2) DEFAULT 0,
    price DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Khách hàng
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    tax_code VARCHAR(50),
    debt DECIMAL(15,2) DEFAULT 0,
    store_id UUID, -- NULL nếu là KH trực tiếp của công ty
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Cửa hàng
CREATE TABLE stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    manager_name VARCHAR(255),
    revenue DECIMAL(15,2) DEFAULT 0,
    is_franchise BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Nhân viên/User
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Lưu trực tiếp, không mã hóa
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL, -- admin, factory_manager, store_manager, staff, etc.
    store_id UUID REFERENCES stores(id), -- NULL nếu là nhân viên xưởng
    department VARCHAR(100), -- Cắt, May, Hoàn thiện, etc.
    salary DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Mã hàng/Sản phẩm
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15,2) DEFAULT 0,
    cost DECIMAL(15,2) DEFAULT 0,
    product_type VARCHAR(50), -- sỉ, lẻ, gia công
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Định mức nguyên vật liệu
CREATE TABLE material_standards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) NOT NULL,
    material_id UUID REFERENCES materials(id) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, material_id)
);

-- Bảng Đơn hàng
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    store_id UUID REFERENCES stores(id),
    order_type VARCHAR(50) NOT NULL, -- sỉ, lẻ, gia công
    total_amount DECIMAL(15,2) DEFAULT 0,
    debt_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, in_production, completed, cancelled
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Chi tiết đơn hàng
CREATE TABLE order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * price) STORED,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Quy trình sản xuất
CREATE TABLE production_process (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) NOT NULL,
    process_code VARCHAR(50) NOT NULL, -- CUT, SEW, FINISH, QC
    process_name VARCHAR(100) NOT NULL, -- Cắt, May, Hoàn thiện, Kiểm tra
    assigned_to UUID REFERENCES users(id),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
    qr_code TEXT, -- Mã QR để quét
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Xuất kho NVL
CREATE TABLE material_exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    export_code VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    export_type VARCHAR(50) NOT NULL, -- production, return, etc.
    total_amount DECIMAL(15,2) DEFAULT 0,
    exported_by UUID REFERENCES users(id),
    export_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Chi tiết xuất kho NVL
CREATE TABLE material_export_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_export_id UUID REFERENCES material_exports(id) NOT NULL,
    material_id UUID REFERENCES materials(id) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Nhập kho NVL
CREATE TABLE material_imports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    import_code VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    import_type VARCHAR(50) NOT NULL, -- purchase, return, etc.
    total_amount DECIMAL(15,2) DEFAULT 0,
    imported_by UUID REFERENCES users(id),
    import_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Chi tiết nhập kho NVL
CREATE TABLE material_import_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_import_id UUID REFERENCES material_imports(id) NOT NULL,
    material_id UUID REFERENCES materials(id) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Kho thành phẩm
CREATE TABLE finished_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity INTEGER NOT NULL,
    store_id UUID REFERENCES stores(id), -- NULL nếu ở kho xưởng
    location VARCHAR(100),
    batch_code VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Xuất thành phẩm
CREATE TABLE product_exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    export_code VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    store_id UUID REFERENCES stores(id), -- Xuất cho cửa hàng nào
    export_type VARCHAR(50) NOT NULL, -- to_store, direct_sale
    total_amount DECIMAL(15,2) DEFAULT 0,
    exported_by UUID REFERENCES users(id),
    export_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Chi tiết xuất thành phẩm
CREATE TABLE product_export_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_export_id UUID REFERENCES product_exports(id) NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Chấm công
CREATE TABLE timekeeping (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    work_date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    total_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES users(id), -- Người chấm công
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Thu chi
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_code VARCHAR(50) UNIQUE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- thu, chi
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50), -- cash, bank, card
    description TEXT,
    store_id UUID REFERENCES stores(id), -- NULL nếu là thu chi xưởng
    created_by UUID REFERENCES users(id),
    transaction_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng Đề xuất thu chi
CREATE TABLE payment_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_code VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    request_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    request_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- MIGRATION: Bổ sung chức năng quản lý cửa hàng
-- Chỉ tạo bảng, logic xử lý ở tầng application
-- ============================================

-- HỆ THỐNG ĐÃ CÓ SẴN:
-- ✅ stores - 4 cửa hàng
-- ✅ customers (có store_id) - Khách hàng của từng cửa hàng
-- ✅ finished_products (có store_id) - Kho riêng từng cửa hàng
-- ✅ orders (có store_id) - Đơn hàng sản xuất (từ cửa hàng gửi xưởng)
-- ✅ product_exports (có store_id) - Xuất TP từ xưởng cho cửa hàng
-- ✅ transactions (có store_id) - Thu chi từng cửa hàng

-- WORKFLOW:
-- 1. Cửa hàng nhận order từ khách → store_customer_orders
-- 2. Kiểm tra finished_products (store_id) → Logic ở app
-- 3. Thiếu hàng → Tạo orders (store_id) gửi xưởng → Logic ở app
-- 4. Xưởng sản xuất → product_exports (store_id)
-- 5. Cửa hàng xác nhận nhận → Cập nhật finished_products → Logic ở app
-- 6. Đủ hàng → store_sales bán cho khách

-- ============================================
-- CÁC BẢNG BỔ SUNG
-- ============================================

-- 1. Bảng Đơn hàng từ khách tại cửa hàng
CREATE TABLE store_customer_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    store_id UUID NOT NULL REFERENCES stores(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    order_date TIMESTAMP DEFAULT NOW(),
    required_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE store_customer_orders IS 'Đơn hàng từ khách tại cửa hàng';
COMMENT ON COLUMN store_customer_orders.status IS 'pending, checking_stock, waiting_production, ready, completed, cancelled';

-- 2. Bảng Chi tiết đơn hàng khách
CREATE TABLE store_customer_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_customer_order_id UUID NOT NULL REFERENCES store_customer_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(15,2) NOT NULL,
    stock_status VARCHAR(50) DEFAULT 'checking',
    available_quantity INTEGER DEFAULT 0,
    shortage_quantity INTEGER DEFAULT 0,
    production_order_id UUID REFERENCES orders(id),
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE store_customer_order_items IS 'Chi tiết sản phẩm trong đơn hàng khách';
COMMENT ON COLUMN store_customer_order_items.stock_status IS 'checking, in_stock, out_of_stock';

-- 3. Bảng Phiếu bán hàng cho khách
CREATE TABLE store_sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_code VARCHAR(50) UNIQUE NOT NULL,
    store_customer_order_id UUID NOT NULL REFERENCES store_customer_orders(id),
    store_id UUID NOT NULL REFERENCES stores(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    sale_date TIMESTAMP DEFAULT NOW(),
    total_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    final_amount DECIMAL(15,2) DEFAULT 0,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'paid',
    paid_amount DECIMAL(15,2) DEFAULT 0,
    sold_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE store_sales IS 'Phiếu bán hàng cho khách';
COMMENT ON COLUMN store_sales.payment_method IS 'cash, card, transfer';
COMMENT ON COLUMN store_sales.payment_status IS 'paid, partial, unpaid';

-- 4. Bảng Chi tiết sản phẩm bán
CREATE TABLE store_sale_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_sale_id UUID NOT NULL REFERENCES store_sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price * (1 - discount_percent/100)) STORED,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE store_sale_items IS 'Chi tiết sản phẩm bán';

-- ============================================
-- BỔ SUNG TRƯỜNG CHO BẢNG CÓ SẴN
-- ============================================

-- Thêm trường xác nhận nhận hàng cho product_exports
ALTER TABLE product_exports ADD COLUMN IF NOT EXISTS received_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE product_exports ADD COLUMN IF NOT EXISTS received_by UUID REFERENCES users(id);
ALTER TABLE product_exports ADD COLUMN IF NOT EXISTS received_at TIMESTAMP;

COMMENT ON COLUMN product_exports.received_status IS 'pending, received, rejected';

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_store_customer_orders_store ON store_customer_orders(store_id);
CREATE INDEX idx_store_customer_orders_customer ON store_customer_orders(customer_id);
CREATE INDEX idx_store_customer_orders_status ON store_customer_orders(status);

CREATE INDEX idx_store_customer_order_items_order ON store_customer_order_items(store_customer_order_id);
CREATE INDEX idx_store_customer_order_items_product ON store_customer_order_items(product_id);

CREATE INDEX idx_store_sales_store ON store_sales(store_id);
CREATE INDEX idx_store_sales_customer_order ON store_sales(store_customer_order_id);
CREATE INDEX idx_store_sales_date ON store_sales(sale_date);

CREATE INDEX idx_product_exports_received_status ON product_exports(received_status);
