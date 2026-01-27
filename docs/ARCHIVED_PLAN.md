
📐 PART 1: SYSTEM ARCHITECTURE (Big Picture)
┌─────────────────────────────────────────────────────────────────────┐
│                         CUSTOMER SIDE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │  WhatsApp    │    │  Web Portal  │    │  Walk-in     │         │
│  │              │    │              │    │  Customer    │         │
│  │ "Kirim file" │    │ "Upload doc" │    │ "Kasih USB"  │         │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘         │
│         │                   │                   │                  │
└─────────┼───────────────────┼───────────────────┼──────────────────┘
          │                   │                   │
          │ Internet          │ Internet          │ Local Network
          │                   │                   │
┌─────────▼───────────────────▼───────────────────▼──────────────────┐
│                      ROUTER / FIREWALL                              │
│                    (192.168.1.1)                                    │
│                                                                     │
│  • Port Forwarding: 443 → 192.168.1.27:3000                        │
│  • Firewall Rules: Allow 80, 443, Block others                     │
│  • DHCP Reservation untuk server                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ Local Network (192.168.1.x)
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    SERVER UBUNTU (192.168.1.27)                     │
│                    tholibserver - Intel i5-3330                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │              APPLICATION LAYER (Docker Containers)            │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │ │
│  │  │  WhatsApp Bot   │  │   API Server    │  │ Web Frontend │ │ │
│  │  │  (Node.js)      │  │   (Express.js)  │  │  (React)     │ │ │
│  │  │  Port: Internal │  │   Port: 3001    │  │  Port: 3000  │ │ │
│  │  │                 │  │                 │  │              │ │ │
│  │  │ • Receive msgs  │  │ • REST API      │  │ • Dashboard  │ │ │
│  │  │ • Send replies  │  │ • Auth          │  │ • Analytics  │ │ │
│  │  │ • File handler  │  │ • Order CRUD    │  │ • Reports    │ │ │
│  │  └────────┬────────┘  └────────┬────────┘  └──────┬───────┘ │ │
│  │           │                    │                   │         │ │
│  │           └────────────────────┼───────────────────┘         │ │
│  │                                │                             │ │
│  │  ┌─────────────────────────────▼──────────────────────────┐ │ │
│  │  │              MESSAGE QUEUE (Redis/Bull)                 │ │ │
│  │  │                                                         │ │ │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │ │
│  │  │  │ Job: PDF │  │Job: Image│  │Job: Print│            │ │ │
│  │  │  │Processing│  │  Enhance │  │  Queue   │            │ │ │
│  │  │  └──────────┘  └──────────┘  └──────────┘            │ │ │
│  │  └──────────────────────┬──────────────────────────────┘ │ │
│  │                         │                                 │ │
│  │  ┌──────────────────────▼──────────────────────────────┐ │ │
│  │  │          PROCESSING ENGINE (Python Workers)          │ │ │
│  │  │                                                      │ │ │
│  │  │  Worker 1: Document Formatter                       │ │ │
│  │  │  • Font standardization (python-docx)               │ │ │
│  │  │  • Auto-numbering (regex patterns)                  │ │ │
│  │  │  • Margin correction                                │ │ │
│  │  │                                                      │ │ │
│  │  │  Worker 2: Image Processor                          │ │ │
│  │  │  • Auto-crop (OpenCV)                               │ │ │
│  │  │  • Deskew/straighten (PIL)                          │ │ │
│  │  │  • Enhance contrast                                 │ │ │
│  │  │                                                      │ │ │
│  │  │  Worker 3: Quality Checker                          │ │ │
│  │  │  • Detect blank pages                               │ │ │
│  │  │  • Blur detection                                   │ │ │
│  │  │  • Orientation check                                │ │ │
│  │  │                                                      │ │ │
│  │  │  Worker 4: PDF Generator                            │ │ │
│  │  │  • Merge multiple files                             │ │ │
│  │  │  • Generate ToC                                     │ │ │
│  │  │  • Add watermark (optional)                         │ │ │
│  │  └──────────────────────┬──────────────────────────────┘ │ │
│  │                         │                                 │ │
│  └─────────────────────────┼─────────────────────────────────┘ │
│                            │                                   │
│  ┌─────────────────────────▼─────────────────────────────────┐ │
│  │                   DATA LAYER                               │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  ┌──────────────────┐         ┌─────────────────────┐    │ │
│  │  │   PostgreSQL     │         │   File Storage      │    │ │
│  │  │   Port: 5432     │         │   /mnt/storage      │    │ │
│  │  │                  │         │                     │    │ │
│  │  │ • Users          │         │ • Uploaded files    │    │ │
│  │  │ • Orders         │         │ • Processed files   │    │ │
│  │  │ • Customers      │         │ • Temp files        │    │ │
│  │  │ • Transactions   │         │ • Backups           │    │ │
│  │  │ • Analytics      │         │                     │    │ │
│  │  └──────────────────┘         └─────────────────────┘    │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  MONITORING & LOGGING                       │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │                                                             │ │
│  │  • PM2 Process Manager (monitoring Node.js apps)            │ │
│  │  • System logs: /var/log/smartcopy/                        │ │
│  │  • Application logs: ~/smartcopy/logs/                     │ │
│  │  • Error tracking: Sentry (optional)                       │ │
│  │  • Performance: htop, iotop, nethogs                       │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    STAFF WORKSTATION                            │
│                    (PC di toko fotocopy)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  • Browser: Akses dashboard http://192.168.1.27:3000           │
│  • Printer terhubung langsung                                  │
│  • Monitor order queue                                         │
│  • Print dokumen yang sudah ready                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

📊 PART 2: DATABASE SCHEMA (PostgreSQL)
sql-- ============================================
-- TABEL: users (Staff & Admin)
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) CHECK (role IN ('admin', 'staff', 'operator')),
    phone VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABEL: customers (Pelanggan)
-- ============================================
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,  -- WhatsApp number
    name VARCHAR(100),
    email VARCHAR(100),
    institution VARCHAR(100),  -- Kampus/instansi
    customer_type VARCHAR(20) CHECK (customer_type IN ('student', 'lecturer', 'general')),
    preferences JSONB,  -- {"paper": "A4", "binding": "spiral", "color": false}
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    loyalty_points INT DEFAULT 0,
    first_order_date TIMESTAMP,
    last_order_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABEL: orders (Order Master)
-- ============================================
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,  -- e.g., "ORD-20260126-0001"
    customer_id INT REFERENCES customers(id),
    
    -- Order Info
    status VARCHAR(20) CHECK (status IN (
        'pending',      -- Baru masuk
        'processing',   -- Sedang diproses AI
        'ready',        -- Siap print
        'printing',     -- Sedang diprint
        'completed',    -- Selesai
        'cancelled',    -- Dibatalkan
        'failed'        -- Gagal
    )) DEFAULT 'pending',
    
    document_type VARCHAR(50),  -- 'skripsi', 'makalah', 'fotocopy', 'ktp', etc
    priority VARCHAR(20) CHECK (priority IN ('normal', 'express', 'urgent')),
    
    -- File Info
    original_filename VARCHAR(255),
    file_path VARCHAR(500),
    processed_file_path VARCHAR(500),
    file_size_mb DECIMAL(10,2),
    
    -- Processing Info
    ai_processing_status VARCHAR(20),
    ai_processing_started_at TIMESTAMP,
    ai_processing_completed_at TIMESTAMP,
    ai_processing_duration_seconds INT,
    ai_flags JSONB,  -- Issues detected: {"blank_pages": [5,6], "blur_pages": [10]}
    
    -- Print Specifications
    page_count INT,
    copies INT DEFAULT 1,
    paper_size VARCHAR(10) DEFAULT 'A4',
    color_mode BOOLEAN DEFAULT false,  -- false = B&W, true = Color
    double_sided BOOLEAN DEFAULT true,
    binding_type VARCHAR(20),  -- 'none', 'staple', 'spiral', 'hardcover'
    
    -- Pricing
    base_price DECIMAL(10,2),
    binding_price DECIMAL(10,2) DEFAULT 0,
    express_fee DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2),
    
    -- Payment
    payment_status VARCHAR(20) CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    payment_method VARCHAR(20),  -- 'cash', 'transfer', 'qris'
    paid_at TIMESTAMP,
    
    -- Notes
    customer_notes TEXT,
    staff_notes TEXT,
    
    -- Staff Assignment
    assigned_to INT REFERENCES users(id),
    
    -- Timestamps
    estimated_completion TIMESTAMP,
    actual_completion TIMESTAMP,
    pickup_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABEL: order_files (Multiple files per order)
-- ============================================
CREATE TABLE order_files (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    file_sequence INT,  -- Urutan file (1, 2, 3...)
    original_filename VARCHAR(255),
    file_path VARCHAR(500),
    file_type VARCHAR(50),  -- 'pdf', 'docx', 'jpg', etc
    file_size_mb DECIMAL(10,2),
    page_count INT,
    
    -- Processing status per file
    processing_status VARCHAR(20),
    processed_file_path VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABEL: processing_logs (AI Processing History)
-- ============================================
CREATE TABLE processing_logs (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    
    step_name VARCHAR(100),  -- 'font_standardization', 'auto_numbering', etc
    status VARCHAR(20) CHECK (status IN ('started', 'completed', 'failed')),
    
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    duration_seconds INT,
    
    worker_id VARCHAR(50)  -- Worker yang mengerjakan
);

-- ============================================
-- TABEL: notifications (History notifikasi)
-- ============================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    customer_id INT REFERENCES customers(id),
    
    notification_type VARCHAR(50),  -- 'order_received', 'processing', 'ready', etc
    channel VARCHAR(20) CHECK (channel IN ('whatsapp', 'sms', 'email')),
    
    recipient VARCHAR(100),  -- Phone/email
    message_content TEXT,
    
    status VARCHAR(20) CHECK (status IN ('sent', 'failed', 'pending')),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABEL: transactions (Payment History)
-- ============================================
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    customer_id INT REFERENCES customers(id),
    
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('payment', 'refund', 'adjustment')),
    amount DECIMAL(10,2),
    payment_method VARCHAR(20),
    
    reference_number VARCHAR(100),  -- Bank transfer ref, QRIS transaction ID
    
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    
    processed_by INT REFERENCES users(id),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- ============================================
-- TABEL: templates (Document Templates)
-- ============================================
CREATE TABLE templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(100),
    institution VARCHAR(100),  -- 'UI', 'UGM', 'ITB', etc
    document_type VARCHAR(50),  -- 'skripsi', 'thesis', 'proposal'
    
    -- Template specifications
    font_family VARCHAR(50),
    font_size INT,
    line_spacing DECIMAL(3,1),
    margin_top DECIMAL(5,2),
    margin_bottom DECIMAL(5,2),
    margin_left DECIMAL(5,2),
    margin_right DECIMAL(5,2),
    
    -- Numbering rules
    chapter_numbering VARCHAR(50),  -- 'BAB I', 'CHAPTER 1', etc
    sub_numbering VARCHAR(50),
    
    -- Other settings
    settings JSONB,  -- Additional custom settings
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABEL: analytics_daily (Daily Statistics)
-- ============================================
CREATE TABLE analytics_daily (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    
    -- Order metrics
    total_orders INT DEFAULT 0,
    completed_orders INT DEFAULT 0,
    cancelled_orders INT DEFAULT 0,
    
    -- Revenue metrics
    total_revenue DECIMAL(12,2) DEFAULT 0,
    avg_order_value DECIMAL(10,2) DEFAULT 0,
    
    -- Document types breakdown
    skripsi_count INT DEFAULT 0,
    makalah_count INT DEFAULT 0,
    fotocopy_count INT DEFAULT 0,
    other_count INT DEFAULT 0,
    
    -- Customer metrics
    new_customers INT DEFAULT 0,
    repeat_customers INT DEFAULT 0,
    
    -- Processing metrics
    avg_processing_time_seconds INT,
    total_pages_printed INT DEFAULT 0,
    
    -- Peak hours
    peak_hour INT,  -- Hour with most orders (0-23)
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABEL: system_config (Settings)
-- ============================================
CREATE TABLE system_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default configs
INSERT INTO system_config (key, value, description) VALUES
('price_per_page_bw', '300', 'Harga per lembar B&W'),
('price_per_page_color', '1500', 'Harga per lembar warna'),
('price_binding_spiral', '5000', 'Harga jilid spiral'),
('price_binding_hardcover', '15000', 'Harga jilid hardcover'),
('express_fee_percentage', '50', 'Persentase biaya express (%)'),
('whatsapp_bot_token', '', 'WhatsApp Bot Token'),
('auto_processing_enabled', 'true', 'Enable AI auto-processing');
```

---

## 🗂️ PART 3: FOLDER STRUCTURE
```
/home/tholib_server/smartcopy/
│
├── backend/                          # Backend API Server
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # PostgreSQL connection
│   │   │   ├── redis.js             # Redis connection
│   │   │   └── app.js               # Express app config
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js   # Login, logout, register
│   │   │   ├── order.controller.js  # CRUD orders
│   │   │   ├── customer.controller.js
│   │   │   ├── analytics.controller.js
│   │   │   └── upload.controller.js # File upload handling
│   │   │
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Order.js
│   │   │   ├── Customer.js
│   │   │   └── Transaction.js
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── customer.routes.js
│   │   │   └── analytics.routes.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # JWT verification
│   │   │   ├── upload.middleware.js # Multer config
│   │   │   └── error.middleware.js  # Error handler
│   │   │
│   │   ├── services/
│   │   │   ├── order.service.js
│   │   │   ├── notification.service.js
│   │   │   └── pricing.service.js
│   │   │
│   │   └── utils/
│   │       ├── logger.js            # Winston logger
│   │       ├── helpers.js
│   │       └── validators.js
│   │
│   ├── package.json
│   ├── .env                          # Environment variables
│   └── server.js                     # Entry point
│
├── whatsapp-bot/                     # WhatsApp Bot
│   ├── src/
│   │   ├── bot.js                   # Main bot logic
│   │   ├── handlers/
│   │   │   ├── message.handler.js   # Handle incoming messages
│   │   │   ├── file.handler.js      # Handle file uploads
│   │   │   └── command.handler.js   # Handle commands (/status, /help)
│   │   │
│   │   ├── services/
│   │   │   ├── queue.service.js     # Add jobs to Redis queue
│   │   │   └── api.service.js       # Call backend API
│   │   │
│   │   └── utils/
│   │       ├── message.template.js  # Message templates
│   │       └── file.utils.js
│   │
│   ├── auth_info/                    # WhatsApp auth session
│   ├── package.json
│   ├── .env
│   └── index.js                      # Entry point
│
├── processing-engine/                # Python Processing Workers
│   ├── workers/
│   │   ├── document_formatter.py    # Font, spacing, margins
│   │   ├── auto_numbering.py        # BAB numbering
│   │   ├── image_processor.py       # Crop, deskew, enhance
│   │   ├── quality_checker.py       # Blur, blank page detection
│   │   ├── pdf_generator.py         # Merge, ToC generation
│   │   └── ocr_processor.py         # Optional: Tesseract OCR
│   │
│   ├── utils/
│   │   ├── docx_helper.py           # python-docx utilities
│   │   ├── pdf_helper.py            # PyPDF2 utilities
│   │   ├── image_helper.py          # PIL/OpenCV utilities
│   │   └── logger.py
│   │
│   ├── models/
│   │   └── db.py                    # PostgreSQL connection
│   │
│   ├── config/
│   │   └── settings.py              # Configuration
│   │
│   ├── requirements.txt
│   ├── .env
│   └── worker_manager.py             # Main worker orchestrator
│
├── frontend/                         # React Dashboard
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   │   ├── Overview.jsx
│   │   │   │   ├── RecentOrders.jsx
│   │   │   │   └── QuickStats.jsx
│   │   │   │
│   │   │   ├── Orders/
│   │   │   │   ├── OrderList.jsx
│   │   │   │   ├── OrderDetail.jsx
│   │   │   │   ├── OrderForm.jsx
│   │   │   │   └── OrderQueue.jsx
│   │   │   │
│   │   │   ├── Customers/
│   │   │   │   ├── CustomerList.jsx
│   │   │   │   └── CustomerDetail.jsx
│   │   │   │
│   │   │   ├── Analytics/
│   │   │   │   ├── SalesChart.jsx
│   │   │   │   ├── PopularDocs.jsx
│   │   │   │   └── PeakHours.jsx
│   │   │   │
│   │   │   └── Common/
│   │   │       ├── Navbar.jsx
│   │   │       ├── Sidebar.jsx
│   │   │       └── Notification.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── Customers.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── Settings.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.js               # Axios instance
│   │   │   ├── auth.service.js
│   │   │   ├── order.service.js
│   │   │   └── customer.service.js
│   │   │
│   │   ├── store/                    # Redux/Zustand state
│   │   │   ├── authSlice.js
│   │   │   ├── orderSlice.js
│   │   │   └── store.js
│   │   │
│   │   ├── utils/
│   │   │   ├── formatters.js
│   │   │   └── validators.js
│   │   │
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── App.css
│   │
│   ├── package.json
│   └── .env
│
├── storage/                          # File Storage
│   ├── uploads/                      # Original uploaded files
│   │   └── 2026/
│   │       └── 01/
│   │           └── 26/
│   │               ├── order-001-file1.pdf
│   │               └── order-001-file2.docx
│   │
│   ├── processed/                    # Processed files
│   │   └── 2026/01/26/
│   │       └── order-001-processed.pdf
│   │
│   ├── temp/                         # Temporary processing files
│   │
│   └── backups/                      # Database backups
│       └── smartcopy-20260126.sql
│
├── logs/                             # Application logs
│   ├── backend.log
│   ├── whatsapp-bot.log
│   ├── processing-engine.log
│   └── nginx-access.log
│
├── scripts/                          # Utility scripts
│   ├── backup.sh                     # Daily backup script
│   ├── cleanup.sh                    # Clean old files
│   ├── health-check.sh               # System health check
│   └── deploy.sh                     # Deployment script
│
├── docker/                           # Docker configs (optional)
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
│
├── docs/                             # Documentation
│   ├── API.md                        # API documentation
│   ├── SETUP.md                      # Setup guide
│   └── ARCHITECTURE.md               # This document!
│
├── .gitignore
├── README.md
└── .env.example                      # Example environment variables

⚙️ PART 4: DATA FLOW (Step-by-Step)
Scenario: Mahasiswa Kirim Skripsi via WhatsApp
┌────────────────────────────────────────────────────────────────┐
│ STEP 1: Customer Upload File                                   │
└────────────────────────────────────────────────────────────────┘

[Mahasiswa]
   │
   │ 1. Kirim file "skripsi_andi.docx" via WhatsApp
   │    Message: "Mau print skripsi 3 eksemplar, jilid hardcover"
   │
   ▼
[WhatsApp Bot - whatsapp-bot/src/bot.js]
   │
   │ 2. Receive message event
   │    - Detect: file attachment (DOCX)
   │    - Detect: text message
   │
   │ 3. Download file dari WhatsApp servers
   │    - Save to: storage/uploads/2026/01/26/temp_xxx.docx
   │
   │ 4. Parse customer message
   │    - Extract: "3 eksemplar", "jilid hardcover"
   │    - Store in metadata
   │
   │ 5. Send auto-reply:
   │    "✅ File diterima, Andi!
   │     Order: ORD-20260126-0001
   │     File: skripsi_andi.docx (2.5MB)
   │     Estimasi: 20 menit
   │     
   │     Kami sedang proses otomatis. Tunggu update ya! 🚀"
   │
   ▼

┌────────────────────────────────────────────────────────────────┐
│ STEP 2: Create Order & Add to Queue                            │
└────────────────────────────────────────────────────────────────┘

[WhatsApp Bot - bot.js]
   │
   │ 6. Call Backend API: POST /api/orders/create
   │    Request Body:
   │    {
   │      "customer_phone": "628123456789",
   │      "document_Lanjutkan20:06type": "skripsi",
│      "copies": 3,
│      "binding_type": "hardcover",
│      "priority": "normal",
│      "file_path": "storage/uploads/2026/01/26/temp_xxx.docx"
│    }
│
▼
[Backend API - backend/src/controllers/order.controller.js]
│
│ 7. Create database records:
│    - Insert into customers (if new)
│    - Insert into orders
│    - Insert into order_files
│    - Generate order_number: "ORD-20260126-0001"
│
│ 8. Add job to Redis Queue:
│    Queue: "document-processing"
│    Job Data: {
│      order_id: 123,
│      file_path: "...",
│      document_type: "skripsi",
│      priority: "normal"
│    }
│
│ 9. Return response to WhatsApp Bot:
│    {
│      "success": true,
│      "order_number": "ORD-20260126-0001",
│      "estimated_completion": "2026-01-26T19:10:00Z"
│    }
│
▼
┌────────────────────────────────────────────────────────────────┐
│ STEP 3: AI Processing (Python Workers)                         │
└────────────────────────────────────────────────────────────────┘
[Processing Engine - processing-engine/worker_manager.py]
│
│ 10. Worker picks job from Redis queue
│
│ 11. Update order status: "processing"
│     Log: processing_logs table
│
▼
[Worker 1: Document Formatter - document_formatter.py]
│
│ 12. Load DOCX file using python-docx
│
│ 13. Detect current formatting:
│     - Font: Mixed (Arial, Calibri, Times)
│     - Size: 11pt, 12pt, 14pt
│     - Line spacing: Single, 1.5
│
│ 14. Apply standardization:
│     - Font: Times New Roman 12pt
│     - Line spacing: 1.5
│     - Margins: Top 4cm, Others 3cm
│     - Paragraph spacing: 6pt
│
│ 15. Save temp file: temp_formatted.docx
│
│ 16. Update processing_logs:
│     INSERT INTO processing_logs (
│       order_id, step_name, status,
│       input_data, output_data,
│       duration_seconds
│     ) VALUES (
│       123, 'font_standardization', 'completed',
│       '{"fonts_found": ["Arial", "Calibri"]}',
│       '{"fonts_applied": "Times New Roman"}',
│       3
│     )
│
▼
[Worker 2: Auto Numbering - auto_numbering.py]
│
│ 17. Parse document structure:
│     - Detect: "BAB II", "BAB IV", "BAB III" (WRONG ORDER!)
│     - Detect: Sub-bab: "2.1.3.4.5" (TOO DEEP!)
│
│ 18. Correct numbering:
│     BAB I   → BAB I
│     BAB II  → BAB II
│     BAB IV  → BAB III  (Fixed!)
│     BAB III → BAB IV   (Fixed!)
│
│     2.1     → 2.1
│     2.1.1   → 2.1.1
│     2.1.2   → 2.1.2
│     (Remove excessive sub-levels)
│
│ 19. Apply changes to document
│
│ 20. Save: temp_numbered.docx
│
▼
[Worker 3: Quality Checker - quality_checker.py]
│
│ 21. Convert DOCX to PDF (using LibreOffice CLI)
│
│ 22. Analyze each page:
│     Page 1: ✅ OK
│     Page 2: ✅ OK
│     Page 5: ⚠️  Blank page detected
│     Page 10: ⚠️ Blur detected (confidence: 0.85)
│     Page 45: ✅ OK
│
│ 23. Store flags in database:
│     UPDATE orders SET ai_flags = '{
│       "blank_pages": [5],
│       "blur_pages": [10]
│     }' WHERE id = 123;
│
│ 24. Decision:
│     - If critical issues → flag for staff review
│     - If minor issues → auto-proceed with warning
│     - If no issues → auto-proceed
│
▼
[Worker 4: PDF Generator - pdf_generator.py]
│
│ 25. Generate Table of Contents:
│     - Extract all headings (Heading 1, Heading 2)
│     - Generate ToC with page numbers
│     - Insert at beginning of document
│
│ 26. Final PDF generation:
│     - Convert formatted DOCX → PDF
│     - Add ToC
│     - Add watermark (optional): "SmartCopy - ORD-20260126-0001"
│
│ 27. Save final file:
│     storage/processed/2026/01/26/ORD-20260126-0001.pdf
│
│ 28. Calculate pages: 47 pages
│
│ 29. Update database:
│     UPDATE orders SET
│       status = 'ready',
│       processed_file_path = '...',
│       page_count = 47,
│       ai_processing_completed_at = NOW(),
│       ai_processing_duration_seconds = 18
│     WHERE id = 123;
│
▼
┌────────────────────────────────────────────────────────────────┐
│ STEP 4: Pricing Calculation                                    │
└────────────────────────────────────────────────────────────────┘
[Backend - backend/src/services/pricing.service.js]
│
│ 30. Calculate pricing:
│
│     Base price:
│     - 47 pages × 3 copies = 141 pages
│     - 141 × Rp 500/page (skripsi rate) = Rp 70,500
│
│     Binding:
│     - 3 hardcovers × Rp 15,000 = Rp 45,000
│
│     Subtotal: Rp 115,500
│     Express fee: Rp 0 (normal priority)
│     Discount: Rp 0
│
│     TOTAL: Rp 115,500
│
│ 31. Update orders table:
│     UPDATE orders SET
│       base_price = 70500,
│       binding_price = 45000,
│       total_price = 115500
│     WHERE id = 123;
│
▼
┌────────────────────────────────────────────────────────────────┐
│ STEP 5: Notification to Customer                               │
└────────────────────────────────────────────────────────────────┘
[Backend - backend/src/services/notification.service.js]
│
│ 32. Trigger WhatsApp notification
│
▼
[WhatsApp Bot - whatsapp-bot/src/handlers/message.handler.js]
│
│ 33. Send message to customer:
│
│     "🎉 Dokumen kamu sudah siap, Andi!
│
│     Order: ORD-20260126-0001
│     Status: Ready to Print ✅
│
│     📄 Skripsi - 47 halaman
│     📦 3 eksemplar, jilid hardcover
│
│     💰 Total: Rp 115,500
│
│     ⚠️  Note: 1 halaman kosong terdeteksi (hal. 5)
│
│     Estimasi selesai: 15 menit
│     Silakan datang ke toko untuk pembayaran & pengambilan.
│
│     Terima kasih! 🙏"
│
│ 34. Insert notification log:
│     INSERT INTO notifications (
│       order_id, customer_id,
│       notification_type, channel,
│       recipient, message_content,
│       status, sent_at
│     ) VALUES (
│       123, 456,
│       'ready_for_pickup', 'whatsapp',
│       '628123456789', '...',
│       'sent', NOW()
│     );
│
▼
┌────────────────────────────────────────────────────────────────┐
│ STEP 6: Staff Dashboard Update (Real-time)                     │
└────────────────────────────────────────────────────────────────┘
[Frontend Dashboard - frontend/src/pages/Orders.jsx]
│
│ 35. WebSocket connection receives update:
│     Event: "order_status_changed"
│     Data: {
│       order_id: 123,
│       new_status: "ready",
│       order_number: "ORD-20260126-0001"
│     }
│
│ 36. UI updates:
│     - Order appears in "Ready to Print" queue
│     - Play notification sound
│     - Show desktop notification (if enabled)
│     - Badge count +1
│
│ 37. Staff clicks order:
│     - View order details
│     - See processed PDF preview
│     - See AI warnings (blank page on hal. 5)
│     - Print button enabled
│
▼
┌────────────────────────────────────────────────────────────────┐
│ STEP 7: Staff Print Document                                   │
└────────────────────────────────────────────────────────────────┘
[Staff PC in Shop]
│
│ 38. Staff clicks "Print" button
│
▼
[Frontend - Order Detail Page]
│
│ 39. Call API: POST /api/orders/123/print
│
▼
[Backend API - order.controller.js]
│
│ 40. Update status: "printing"
│
│ 41. Trigger print command:
│     - Open PDF file
│     - Send to default printer
│     - Print settings:
│       * Copies: 3
│       * Double-sided: Yes
│       * Color: No (B&W)
│
│ 42. Staff manually do binding (hardcover)
│
│ 43. Staff marks as completed:
│     - Click "Mark Complete" button
│
│ 44. Update database:
│     UPDATE orders SET
│       status = 'completed',
│       actual_completion = NOW()
│     WHERE id = 123;
│
▼
┌────────────────────────────────────────────────────────────────┐
│ STEP 8: Payment & Pickup                                       │
└────────────────────────────────────────────────────────────────┘
[Staff Dashboard - Payment Modal]
│
│ 45. Customer arrives at shop
│
│ 46. Staff opens payment dialog:
│     Total: Rp 115,500
│     Payment method: [ Cash | Transfer | QRIS ]
│
│ 47. Customer pays cash: Rp 120,000
│     Change: Rp 4,500
│
│ 48. Staff clicks "Confirm Payment"
│
▼
[Backend API - transaction.controller.js]
│
│ 49. Create transaction record:
│     INSERT INTO transactions (
│       order_id, customer_id,
│       transaction_type, amount,
│       payment_method, status
│     ) VALUES (
│       123, 456,
│       'payment', 115500,
│       'cash', 'completed'
│     );
│
│ 50. Update order:
│     UPDATE orders SET
│       payment_status = 'paid',
│       paid_at = NOW(),
│       pickup_time = NOW()
│     WHERE id = 123;
│
│ 51. Update customer stats:
│     UPDATE customers SET
│       total_orders = total_orders + 1,
│       total_spent = total_spent + 115500,
│       loyalty_points = loyalty_points + 115,
│       last_order_date = NOW()
│     WHERE id = 456;
│
▼
┌────────────────────────────────────────────────────────────────┐
│ STEP 9: Post-Order Actions                                     │
└────────────────────────────────────────────────────────────────┘
[Backend - Cron Job / Background Task]
│
│ 52. Send thank you message (after 1 hour):
│     "Terima kasih sudah order di SmartCopy, Andi! 🙏
│
│     Puas dengan layanan kami?
│     Ajak teman kamu dan dapatkan diskon 10%!
│
│     Loyalty Points kamu: 115 poin
│     (100 poin = Rp 10,000 discount)"
│
│ 53. Update daily analytics:
│     UPDATE analytics_daily SET
│       total_orders = total_orders + 1,
│       completed_orders = completed_orders + 1,
│       total_revenue = total_revenue + 115500,
│       skripsi_count = skripsi_count + 1,
│       total_pages_printed = total_pages_printed + 141
│     WHERE date = '2026-01-26';
│
│ 54. Cleanup temp files (after 24 hours):
│     DELETE files in storage/temp/ older than 24h
│
│ 55. Archive order (after 30 days):
│     MOVE processed file to storage/backups/archive/
│
└─ DONE! ✅

---

## 🔧 PART 5: TECHNOLOGY STACK DETAIL
```yaml
# Backend API Server
Language: Node.js (v18+)
Framework: Express.js
Database ORM: Sequelize / Prisma
Authentication: JWT (jsonwebtoken)
File Upload: Multer
Process Manager: PM2
Real-time: Socket.io (for live dashboard updates)

Dependencies:
  - express: ^4.18.2
  - pg: ^8.11.0              # PostgreSQL client
  - sequelize: ^6.32.0
  - bcryptjs: ^2.4.3         # Password hashing
  - jsonwebtoken: ^9.0.0
  - multer: ^1.4.5
  - bull: ^4.11.0            # Job queue
  - redis: ^4.6.0
  - socket.io: ^4.6.0
  - winston: ^3.10.0         # Logging
  - dotenv: ^16.3.0
  - cors: ^2.8.5
  - helmet: ^7.0.0           # Security headers
  - express-rate-limit: ^6.9.0

---

# WhatsApp Bot
Language: Node.js
Library: Baileys (@whiskeysockets/baileys)
QR Code: qrcode-terminal

Dependencies:
  - @whiskeysockets/baileys: ^6.4.0
  - qrcode-terminal: ^0.12.0
  - pino: ^8.14.0            # Logging
  - axios: ^1.4.0            # API calls
  - node-cron: ^3.0.2        # Scheduled tasks

---

# Processing Engine
Language: Python (3.10+)
Task Queue: Celery + Redis (alternative to Bull)

Core Libraries:
  - python-docx: ^0.8.11     # Word document manipulation
  - PyPDF2: ^3.0.1           # PDF operations
  - Pillow: ^10.0.0          # Image processing
  - opencv-python: ^4.8.0    # Advanced image processing
  - reportlab: ^4.0.4        # PDF generation
  - psycopg2-binary: ^2.9.6  # PostgreSQL
  - redis: ^4.6.0            # Job queue
  - celery: ^5.3.0           # Task queue

Optional (Phase 2+):
  - pytesseract: ^0.3.10     # OCR
  - spacy: ^3.6.0            # NLP (for grammar check)
  - langdetect: ^1.0.9       # Language detection

---

# Frontend Dashboard
Framework: React (v18+)
Build Tool: Vite
UI Library: Tailwind CSS + shadcn/ui
State Management: Zustand / Redux Toolkit
HTTP Client: Axios
Routing: React Router v6
Charts: Recharts / Chart.js
Real-time: Socket.io-client

Dependencies:
  - react: ^18.2.0
  - react-dom: ^18.2.0
  - react-router-dom: ^6.14.0
  - axios: ^1.4.0
  - zustand: ^4.3.9
  - tailwindcss: ^3.3.3
  - @radix-ui/react-*: Various  # For shadcn components
  - recharts: ^2.7.0
  - socket.io-client: ^4.6.0
  - react-hot-toast: ^2.4.1  # Notifications
  - lucide-react: ^0.263.1   # Icons

---

# Database
Primary: PostgreSQL 14+
Cache/Queue: Redis 7+
Backup: pg_dump (automated daily)

---

# Web Server & Reverse Proxy
Development: Express built-in
Production: Nginx
  - Reverse proxy to Express (port 3001)
  - Serve static React build (port 3000)
  - SSL/TLS: Let's Encrypt
  - Rate limiting
  - GZIP compression

---

# System Tools
Process Manager: PM2
  - Auto-restart on crash
  - Log rotation
  - Cluster mode (multi-core)

Monitoring:
  - htop: CPU/Memory monitoring
  - iotop: Disk I/O monitoring
  - nethogs: Network monitoring
  - PM2 Monitoring (free tier)

Logging:
  - Winston (Node.js)
  - Python logging module
  - Nginx access/error logs
  - Centralized: Papertrail / Logtail (optional)

Backup:
  - Database: pg_dump daily via cron
  - Files: rsync to external drive
  - Retention: 30 days

---

# Development Tools
Code Editor: VS Code with Remote-SSH extension
Version Control: Git + GitHub/GitLab
API Testing: Postman / Thunder Client (VS Code)
Database Client: DBeaver / pgAdmin
Redis GUI: RedisInsight

VS Code Extensions:
  - Remote - SSH
  - ESLint
  - Prettier
  - Python
  - Tailwind CSS IntelliSense
  - GitLens
  - Thunder Client (API testing)

---

# Deployment
Method: Manual via SSH (Phase 1)
Future: Docker + Docker Compose (Phase 2)

Docker Services (Future):
  - backend-api (Express)
  - whatsapp-bot (Baileys)
  - processing-worker (Python)
  - postgres (Database)
  - redis (Cache/Queue)
  - nginx (Reverse proxy)
```

---

## 🚀 PART 6: DEPLOYMENT STEPS (Manual - Phase 1)
```bash
# ====================================
# INITIAL SERVER SETUP
# ====================================

# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js (v18 LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install Python 3.10+
sudo apt install -y python3 python3-pip python3-venv

# 4. Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 5. Install Redis
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis

# 6. Install system dependencies
sudo apt install -y \
  git \
  imagemagick \
  libreoffice \
  tesseract-ocr \
  build-essential \
  libpq-dev

# 7. Install PM2 globally
sudo npm install -g pm2

# ====================================
# DATABASE SETUP
# ====================================

# 8. Create PostgreSQL database & user
sudo -u postgres psql << EOF
CREATE DATABASE smartcopy;
CREATE USER smartcopy_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE smartcopy TO smartcopy_user;
\q
EOF

# 9. Run database migrations (execute SQL from PART 2)
psql -U smartcopy_user -d smartcopy -f /path/to/schema.sql

# ====================================
# APPLICATION SETUP
# ====================================

# 10. Clone/create project directory
cd ~
mkdir smartcopy
cd smartcopy

# 11. Setup Backend API
mkdir backend && cd backend
npm init -y
npm install express pg sequelize bcryptjs jsonwebtoken multer \
  bull redis socket.io winston dotenv cors helmet express-rate-limit

# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartcopy
DB_USER=smartcopy_user
DB_PASSWORD=your_secure_password
JWT_SECRET=$(openssl rand -base64 32)
REDIS_HOST=localhost
REDIS_PORT=6379
EOF

# 12. Setup WhatsApp Bot
cd ~/smartcopy
mkdir whatsapp-bot && cd whatsapp-bot
npm init -y
npm install @whiskeysockets/baileys qrcode-terminal pino axios node-cron

# Create .env
cat > .env << EOF
API_URL=http://localhost:3001
REDIS_HOST=localhost
REDIS_PORT=6379
EOF

# 13. Setup Python Processing Engine
cd ~/smartcopy
mkdir processing-engine && cd processing-engine
python3 -m venv venv
source venv/bin/activate
pip install python-docx PyPDF2 Pillow opencv-python reportlab \
  psycopg2-binary redis celery

# Create .env
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartcopy
DB_USER=smartcopy_user
DB_PASSWORD=your_secure_password
REDIS_HOST=localhost
REDIS_PORT=6379
EOF

# 14. Setup Frontend
cd ~/smartcopy
mkdir frontend && cd frontend
npm create vite@latest . -- --template react
npm install
npm install axios zustand react-router-dom tailwindcss recharts \
  socket.io-client react-hot-toast lucide-react

# Initialize Tailwind
npx tailwindcss init -p

# Build for production
npm run build

# ====================================
# NGINX SETUP (Production Web Server)
# ====================================

# 15. Install Nginx
sudo apt install -y nginx

# 16. Create Nginx config
sudo nano /etc/nginx/sites-available/smartcopy

# Paste this config:
server {
    listen 80;
    server_name 192.168.1.27;  # Or your domain

    # Frontend (React build)
    location / {
        root /home/tholib_server/smartcopy/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket for real-time updates
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/smartcopy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# ====================================
# START SERVICES WITH PM2
# ====================================

# 17. Start Backend API
cd ~/smartcopy/backend
pm2 start src/server.js --name "smartcopy-api"

# 18. Start WhatsApp Bot
cd ~/smartcopy/whatsapp-bot
pm2 start src/index.js --name "whatsapp-bot"

# 19. Start Python Workers (using PM2 too!)
cd ~/smartcopy/processing-engine
pm2 start worker_manager.py --name "processing-worker" \
  --interpreter python3

# 20. Save PM2 config & enable auto-start on boot
pm2 save
pm2 startup

# 21. View all running services
pm2 status

# Expected output:
┌─────┬────────────────────┬─────────┬─────────┬─────────┐
│ id  │ name               │ status  │ cpu     │ memory  │
├─────┼────────────────────┼─────────┼─────────┼─────────┤
│ 0   │ smartcopy-api      │ online  │ 0.2%    │ 45.2mb  │
│ 1   │ whatsapp-bot       │ online  │ 0.1%    │ 35.8mb  │
│ 2   │ processing-worker  │ online  │ 0.5%    │ 120mb   │
└─────┴────────────────────┴─────────┴─────────┴─────────┘

# ====================================
# SETUP BACKUP & CRON JOBS
# ====================================

# 22. Create backup script
nano ~/smartcopy/scripts/backup.sh

#!/bin/bash
BACKUP_DIR="/home/tholib_server/smartcopy/storage/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump -U smartcopy_user smartcopy > "$BACKUP_DIR/db_$DATE.sql"

# File backup (uploaded & processed files)
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" \
  /home/tholib_server/smartcopy/storage/uploads \
  /home/tholib_server/smartcopy/storage/processed

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

chmod +x ~/smartcopy/scripts/backup.sh

# 23. Add cron job for daily backup (2 AM)
crontab -e

# Add this line:
0 2 * * * /home/tholib_server/smartcopy/scripts/backup.sh

# 24. Add cron for cleanup temp files
0 3 * * * find /home/tholib_server/smartcopy/storage/temp -type f -mtime +1 -delete

# ====================================
# FIREWALL SETUP
# ====================================

# 25. Configure UFW (firewall)
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# ====================================
# TESTING
# ====================================

# 26. Test backend API
curl http://localhost:3001/api/health
# Expected: {"status": "ok", "timestamp": "..."}

# 27. Test frontend
curl http://192.168.1.27
# Should return HTML

# 28. Test WhatsApp Bot
# Check PM2 logs:
pm2 logs whatsapp-bot
# Should show: "WhatsApp bot connected, scan QR code"

# 29. Scan QR code with WhatsApp
# QR will appear in terminal, scan with your WA

# 30. Test end-to-end
# Send a test message to the WhatsApp number
# Check logs: pm2 logs whatsapp-bot

# ====================================
# MONITORING
# ====================================

# Real-time monitoring
pm2 monit

# View logs
pm2 logs

# Restart specific service
pm2 restart smartcopy-api

# Restart all
pm2 restart all

# View system resources
htop

# Check disk usage
df -h
du -sh ~/smartcopy/*

# Check PostgreSQL
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Check Redis
redis-cli ping
# Should return: PONG
```

---

Nah ini **blueprint lengkap** dari sistem SmartCopy. Super detail dari arsitektur, database, data flow, sampai deployment steps.