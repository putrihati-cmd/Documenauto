# 🔄 Migration Guide: Phase 1 → Phase 2

## 📋 Overview

This guide will help you integrate Phase 2 features into your existing Phase 1 SmartCopy project.

**Time Required**: ~30 minutes  
**Complexity**: Medium  
**Breaking Changes**: None ✅

## ✅ Pre-Migration Checklist

Before starting, ensure:
- [ ] Phase 1 is working correctly
- [ ] Database backup created
- [ ] Git repository is clean
- [ ] All containers are stopped

## 🚀 Step-by-Step Migration

### Step 1: Backup Everything

```bash
# Backup database
docker-compose exec postgres pg_dump -U smartcopy smartcopy_db > backup_$(date +%Y%m%d).sql

# Backup code
git add .
git commit -m "Backup before Phase 2 migration"
git tag phase1-backup
```

### Step 2: Apply Database Changes

```bash
# Copy schema file
cp smartcopy-phase2/database/schema_templates.sql YOUR_PROJECT/database/

# Apply schema
docker-compose exec postgres psql -U smartcopy -d smartcopy_db -f /database/schema_templates.sql

# Or if not using Docker:
psql -U smartcopy -d smartcopy_db -f database/schema_templates.sql
```

**Verification:**
```sql
-- Check new tables exist
\dt templates
\dt order_processing_versions
```

### Step 3: Copy Backend Files

```bash
cd YOUR_PROJECT

# Create directories if they don't exist
mkdir -p backend/src/controllers
mkdir -p backend/src/routes
mkdir -p backend/templates

# Copy new controller
cp ../smartcopy-phase2/backend/src/controllers/template.controller.js \
   backend/src/controllers/

# Copy new routes
cp ../smartcopy-phase2/backend/src/routes/template.routes.js \
   backend/src/routes/
```

### Step 4: Update Backend server.js

**Add these lines to `backend/server.js`:**

```javascript
// After existing imports
const templateRoutes = require('./src/routes/template.routes');

// After existing routes
app.use('/api', templateRoutes);
```

**Full example:**
```javascript
// ... existing imports ...
const orderRoutes = require('./src/routes/order.routes');
const templateRoutes = require('./src/routes/template.routes'); // NEW

// ... existing middleware ...

// Routes
app.use('/api', orderRoutes);
app.use('/api', templateRoutes); // NEW

// ... rest of server.js ...
```

### Step 5: Copy Frontend Components

```bash
# Create admin directory
mkdir -p frontend/src/components/admin

# Copy TemplateManager component
cp ../smartcopy-phase2/frontend/src/components/admin/TemplateManager.jsx \
   frontend/src/components/admin/
```

### Step 6: Update Frontend App.jsx

**Add route for template manager:**

```jsx
// Add import
import TemplateManager from './components/admin/TemplateManager';

// Add route (inside <Routes>)
<Route path="/admin/templates" element={<TemplateManager />} />
```

**Full example:**
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UploadPage from './components/UploadPage';
import TemplateManager from './components/admin/TemplateManager'; // NEW

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/admin/templates" element={<TemplateManager />} /> {/* NEW */}
      </Routes>
    </BrowserRouter>
  );
}
```

**If you don't have React Router yet:**
```bash
cd frontend
npm install react-router-dom
```

### Step 7: Copy Processing Engine

```bash
# Copy smart processor
cp ../smartcopy-phase2/processing-engine/smart_processor.py \
   processing-engine/
```

### Step 8: Restart Services

```bash
# Rebuild and restart
docker-compose down
docker-compose up --build -d

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Step 9: Verify Migration

**1. Check Backend:**
```bash
# Health check
curl http://localhost:3003/health

# Check templates endpoint
curl http://localhost:3003/api/templates
```

Expected response:
```json
{
  "success": true,
  "data": [...]
}
```

**2. Check Frontend:**
```
Open: http://localhost:3002/admin/templates
```

Should see: Template Manager page with sample templates

**3. Check Database:**
```sql
-- Check sample templates inserted
SELECT * FROM templates;

-- Should see 2 sample templates
```

## 🧪 Test New Features

### Test 1: List Templates
```bash
curl http://localhost:3003/api/templates
```

### Test 2: Create Template (Mock)
```bash
curl -X POST http://localhost:3003/api/templates \
  -F "name=Test Template" \
  -F "category=skripsi" \
  -F "institution=Test University" \
  -F "file=@test.docx" \
  -F 'rules_json={"global":{"margins":{"top":"4cm"}}}'
```

### Test 3: Process Document
```bash
# Create test rules
cat > rules.json << 'EOF'
{
  "global": {
    "margins": {"top": "4cm", "bottom": "3cm", "left": "3cm", "right": "3cm"},
    "font": {"name": "Times New Roman", "size": "12pt"}
  }
}
EOF

# Test processing
python processing-engine/smart_processor.py \
  test_input.docx \
  rules.json \
  test_output.docx
```

## 🔧 Troubleshooting

### Issue: "Module not found: template.controller"

**Solution:**
```bash
# Check file exists
ls -la backend/src/controllers/template.controller.js

# Check path in routes file
cat backend/src/routes/template.routes.js | grep require
```

### Issue: "Templates table does not exist"

**Solution:**
```bash
# Re-apply schema
docker-compose exec postgres psql -U smartcopy -d smartcopy_db \
  -f /database/schema_templates.sql
```

### Issue: "Port 3002 already in use"

**Solution:**
```bash
# Find and kill process
lsof -ti:3002 | xargs kill -9

# Or change port in docker-compose.yml
```

### Issue: Frontend shows blank page

**Solution:**
```bash
# Check console for errors
# Rebuild frontend
cd frontend
npm install
npm run build
```

## 📦 Rollback Plan

If something goes wrong:

### Rollback Database:
```bash
# Restore from backup
psql -U smartcopy -d smartcopy_db < backup_YYYYMMDD.sql
```

### Rollback Code:
```bash
# Restore from git
git reset --hard phase1-backup

# Restart services
docker-compose down
docker-compose up --build -d
```

## ✅ Migration Checklist

After migration, verify:

- [ ] Backend starts without errors
- [ ] Frontend loads correctly
- [ ] `/api/templates` endpoint responds
- [ ] `/admin/templates` page loads
- [ ] Database has `templates` table
- [ ] Smart processor runs successfully
- [ ] Existing Phase 1 features still work
- [ ] No console errors in browser

## 🎉 Post-Migration

You now have:
- ✅ Template management API
- ✅ Smart document processor
- ✅ Admin UI for templates
- ✅ Database schema ready
- ✅ All Phase 1 features intact

## 🚀 Next Steps

1. **Populate Templates**: Upload real templates via UI (when Phase 2.1 complete)
2. **Test Processing**: Try processing documents with different templates
3. **Customize Rules**: Adjust template rules for your institution
4. **Train Staff**: Show staff how to use template manager

## 📞 Need Help?

Check:
1. `README.md` - Overview and features
2. `IMPLEMENTATION_GUIDE.md` - Detailed technical guide
3. Logs: `docker-compose logs [service]`

---

**Migration Status**: Complete ✅  
**Phase 1 Compatible**: Yes ✅  
**Breaking Changes**: None ✅  
**Estimated Time**: 30 minutes  
