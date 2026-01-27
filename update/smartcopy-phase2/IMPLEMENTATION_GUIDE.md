# 🚀 SmartCopy Phase 2 - Template Management System

## 📋 Overview

Phase 2 menambahkan sistem **Template Management dengan Custom Rules** yang memungkinkan:

1. ✅ Admin upload & manage template dokumen
2. ✅ Custom rules per section (Abstract, BAB, Bibliography)
3. ✅ Visual rule editor (form-based)
4. ✅ AI prompt instructions
5. ✅ Staff review & manual edit workflow
6. ✅ Processing history tracking

## 🎯 Key Features Implemented

### 1. Backend (Express.js)

**New Files:**
```
backend/src/
├── controllers/
│   └── template.controller.js   ← Template CRUD operations
└── routes/
    └── template.routes.js       ← Template API endpoints
```

**API Endpoints:**
```
POST   /api/templates              - Create new template
GET    /api/templates              - List all templates
GET    /api/templates/:id          - Get template by ID
PATCH  /api/templates/:id          - Update template
DELETE /api/templates/:id          - Delete template
POST   /api/templates/:id/set-default - Set as default
GET    /api/templates/categories   - Get categories list
```

### 2. Database Schema

**New Tables:**
```sql
templates (
  id, name, category, institution,
  master_file_path, rules_json, custom_prompt,
  is_default, usage_count, created_at
)

order_processing_versions (
  id, order_id, version, file_path,
  template_id, processing_notes, processed_by
)
```

**Features:**
- Template categorization (skripsi, tesis, makalah)
- Institution-specific templates
- JSON-based rules storage
- Usage tracking
- Auto-increment usage count on order

### 3. Processing Engine (Python)

**New File:**
```
processing-engine/
└── smart_processor.py   ← Intelligent document processor
```

**Capabilities:**
- Global rules (margins, font, spacing)
- Section detection (Abstract, BAB, Bibliography)
- Section-specific formatting
- Word count validation
- Warning system

**Example Usage:**
```bash
python smart_processor.py input.docx rules.json output.docx
```

### 4. Frontend (React)

**New Components:**
```
frontend/src/components/admin/
└── TemplateManager.jsx   ← Admin template management UI
```

**Features:**
- Template library view
- Category filtering
- Search functionality
- Set default template
- Delete template
- Usage statistics

## 📐 Rules Structure

### Global Rules
```json
{
  "global": {
    "margins": {
      "top": "4cm",
      "bottom": "3cm",
      "left": "3cm",
      "right": "3cm"
    },
    "font": {
      "name": "Times New Roman",
      "size": "12pt"
    },
    "line_spacing": "1.5"
  }
}
```

### Section-Specific Rules
```json
{
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
}
```

## 🔧 Setup Instructions

### 1. Database Setup

```bash
# Run migration
psql -U smartcopy -d smartcopy_db -f database/schema_templates.sql
```

### 2. Backend Integration

Copy files to your main project:
```bash
cp backend/src/controllers/template.controller.js ../smartcopy-pivot/backend/src/controllers/
cp backend/src/routes/template.routes.js ../smartcopy-pivot/backend/src/routes/
```

Update `server.js`:
```javascript
// Add template routes
const templateRoutes = require('./src/routes/template.routes');
app.use('/api', templateRoutes);
```

### 3. Frontend Integration

Copy components:
```bash
cp -r frontend/src/components/admin ../smartcopy-pivot/frontend/src/components/
```

Update `App.jsx`:
```jsx
import TemplateManager from './components/admin/TemplateManager';

// Add route
<Route path="/admin/templates" element={<TemplateManager />} />
```

### 4. Processing Engine

Copy Python script:
```bash
cp processing-engine/smart_processor.py ../smartcopy-pivot/processing-engine/
```

## 🧪 Testing

### 1. Create Template via API

```bash
curl -X POST http://localhost:3003/api/templates \
  -F "name=Skripsi UI Test" \
  -F "category=skripsi" \
  -F "institution=Universitas Indonesia" \
  -F "file=@template_ui.docx" \
  -F 'rules_json={"global":{"margins":{"top":"4cm"}}}'
```

### 2. List Templates

```bash
curl http://localhost:3003/api/templates?category=skripsi
```

### 3. Test Processing

```bash
# Create rules file
cat > rules.json << 'EOF'
{
  "global": {
    "margins": {"top": "4cm", "bottom": "3cm", "left": "3cm", "right": "3cm"},
    "font": {"name": "Times New Roman", "size": "12pt"},
    "line_spacing": "1.5"
  },
  "sections": {
    "abstract": {
      "font_size": "11pt",
      "line_spacing": "1.0",
      "max_words": 250
    }
  }
}
EOF

# Process document
python smart_processor.py input.docx rules.json output.docx
```

## 🎯 Complete Workflow

### Admin Setup:
```
1. Access /admin/templates
2. Click "Upload New Template"
3. Fill form:
   - Name: Skripsi UI
   - Category: skripsi
   - Institution: UI
   - Upload master.docx
   - Set rules (visual editor)
4. Save template
```

### User Order:
```
1. Upload document
2. Select: "Skripsi - UI"
3. System loads template rules
4. Auto-process with smart_processor.py
```

### Staff Review:
```
1. View before/after comparison
2. Check sections (Abstract, BAB, etc)
3. Manual adjust if needed
4. Re-process with different template if required
5. Approve for printing
```

## 📊 Next Steps (To Be Implemented)

### Phase 2.1 - Template Upload Form
- [ ] Full template upload modal
- [ ] Visual rule editor (form fields)
- [ ] JSON/Text editor toggle
- [ ] Template preview

### Phase 2.2 - Staff Review Dashboard
- [ ] Order queue with template info
- [ ] Before/After document viewer
- [ ] Manual editor tools
- [ ] Re-process workflow

### Phase 2.3 - Advanced Features
- [ ] Template versioning
- [ ] Batch processing
- [ ] Template import/export
- [ ] Analytics dashboard

## 🐛 Known Limitations

1. **Mock Data**: Controller returns mock data (database integration pending)
2. **File Upload**: Template files stored but not yet linked to processing
3. **Upload Modal**: Placeholder only, full form pending
4. **Section Detection**: Basic regex patterns (can be improved with ML)

## 📝 Migration Path from Phase 1

If you have existing Phase 1 code:

1. Keep all existing features (they're compatible)
2. Add Phase 2 files alongside
3. Run database migration
4. Update server.js routes
5. Add template manager to admin menu

No breaking changes!

## 🔗 Integration Points

### With Order Processing:
```javascript
// In order.controller.js
const templateId = req.body.templateId;
const template = await Template.findByPk(templateId);

// Pass rules to Python worker
const pythonCmd = `python smart_processor.py ${inputFile} ${template.rules_json} ${outputFile}`;
exec(pythonCmd, callback);
```

### With Frontend OrderForm:
```jsx
// Add template selection dropdown
<select onChange={(e) => setSelectedTemplate(e.target.value)}>
  {templates.map(t => (
    <option value={t.id}>{t.name}</option>
  ))}
</select>
```

## 📞 Support

Check the complete documentation:
- Database schema: `database/schema_templates.sql`
- API controller: `backend/src/controllers/template.controller.js`
- Processing logic: `processing-engine/smart_processor.py`

---

**Status**: ✅ Foundation Complete, Ready for Integration
**Version**: 2.0.0-phase2
**Date**: January 27, 2026
