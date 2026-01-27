-- ============================================
-- TEMPLATE MANAGEMENT SCHEMA
-- ============================================

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'skripsi', 'tesis', 'makalah', etc
    institution VARCHAR(100),
    description TEXT,
    
    -- Files
    master_file_path VARCHAR(500) NOT NULL,
    master_file_name VARCHAR(255) NOT NULL,
    
    -- Rules and Instructions
    rules_json JSONB NOT NULL DEFAULT '{}',
    custom_prompt TEXT,
    
    -- Metadata
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INT DEFAULT 0,
    
    -- Audit
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP
);

-- Add template_id to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS template_id INT REFERENCES templates(id),
ADD COLUMN IF NOT EXISTS processing_version INT DEFAULT 1;

-- Processing history for tracking edits
CREATE TABLE IF NOT EXISTS order_processing_versions (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    version INT NOT NULL,
    
    -- Files
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    
    -- Processing info
    template_id INT REFERENCES templates(id),
    processing_method VARCHAR(50), -- 'auto', 'manual', 're-process'
    processing_notes TEXT,
    
    -- Quality metrics
    rules_applied JSONB,
    warnings JSONB,
    
    -- Audit
    processed_by INT REFERENCES users(id),
    processed_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(order_id, version)
);

-- Create indexes
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_institution ON templates(institution);
CREATE INDEX idx_templates_is_default ON templates(is_default);
CREATE INDEX idx_orders_template ON orders(template_id);
CREATE INDEX idx_processing_versions_order ON order_processing_versions(order_id);

-- Insert sample templates (for testing)
INSERT INTO templates (name, category, institution, master_file_path, master_file_name, rules_json, custom_prompt, is_default) VALUES
(
    'Skripsi UI Standard',
    'skripsi',
    'Universitas Indonesia',
    '/templates/skripsi/ui_standard.docx',
    'ui_standard.docx',
    '{
        "global": {
            "margins": {"top": "4cm", "bottom": "3cm", "left": "3cm", "right": "3cm"},
            "font": {"name": "Times New Roman", "size": "12pt"},
            "line_spacing": "1.5"
        },
        "sections": {
            "abstract": {
                "font_size": "11pt",
                "line_spacing": "1.0",
                "title_style": "italic",
                "max_words": 250
            },
            "chapter_headings": {
                "font_size": "14pt",
                "font_weight": "bold",
                "text_transform": "uppercase",
                "spacing_before": "18pt",
                "spacing_after": "12pt"
            },
            "bibliography": {
                "indent_hanging": "1cm",
                "line_spacing": "1.0"
            }
        }
    }',
    'Format standar skripsi UI: Margin 4-3-3-3, Font TNR 12pt, Spacing 1.5. Abstrak menggunakan font 11pt single space. BAB huruf kapital bold 14pt.',
    true
),
(
    'Skripsi UGM Standard',
    'skripsi',
    'Universitas Gadjah Mada',
    '/templates/skripsi/ugm_standard.docx',
    'ugm_standard.docx',
    '{
        "global": {
            "margins": {"top": "4cm", "bottom": "3cm", "left": "4cm", "right": "3cm"},
            "font": {"name": "Times New Roman", "size": "12pt"},
            "line_spacing": "2.0"
        },
        "sections": {
            "abstract": {
                "font_size": "12pt",
                "line_spacing": "1.0",
                "max_words": 300
            },
            "chapter_headings": {
                "font_size": "14pt",
                "font_weight": "bold",
                "text_transform": "uppercase"
            }
        }
    }',
    'Format skripsi UGM: Margin kiri 4cm, spacing 2.0 (double). Abstrak max 300 kata.',
    false
);

-- Function to update template usage count
CREATE OR REPLACE FUNCTION update_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE templates 
    SET usage_count = usage_count + 1,
        last_used = NOW()
    WHERE id = NEW.template_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_template_usage
AFTER INSERT ON orders
FOR EACH ROW
WHEN (NEW.template_id IS NOT NULL)
EXECUTE FUNCTION update_template_usage();
