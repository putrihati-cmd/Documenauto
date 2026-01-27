const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const TemplateStore = require('../models/template.store');

// Configure multer for template uploads
const templateStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const category = req.body.category || 'general';
    const uploadDir = path.join(__dirname, `../../storage/templates/${category}`);
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).toLowerCase().replace(/\s+/g, '_');
    cb(null, `${name}_${uniqueSuffix}${ext}`);
  }
});

const uploadTemplate = multer({
  storage: templateStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only DOCX files are allowed for templates'));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB max
});

// Create new template
const createTemplate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Template file is required'
      });
    }

    const {
      name,
      category,
      institution,
      description,
      rules_json,
      custom_prompt,
      is_default
    } = req.body;

    // Validate required fields
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name and category are required'
      });
    }

    // Parse rules_json if string
    let rulesData = {};
    if (rules_json) {
      try {
        rulesData = typeof rules_json === 'string' ? JSON.parse(rules_json) : rules_json;
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid rules_json format'
        });
      }
    }

    // If setting as default, unset other defaults in same category
    if (is_default === 'true' || is_default === true) {
      // In production, update database:
      // await Template.update(
      //   { is_default: false },
      //   { where: { category, is_default: true } }
      // );
    }

    // Create template record
    const templateData = {
      name,
      category,
      institution: institution || null,
      description: description || null,
      master_file_path: req.file.path,
      master_file_name: req.file.filename,
      rules_json: rulesData,
      custom_prompt: custom_prompt || null,
      is_default: is_default === 'true' || is_default === true
    };

    // Save to JSON Store
    const savedTemplate = await TemplateStore.create(templateData);

    console.log('Template created:', savedTemplate);

    return res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: savedTemplate
    });

  } catch (error) {
    console.error('Error creating template:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: error.message
    });
  }
};

// List all templates
const listTemplates = async (req, res) => {
  try {
    const { category, institution, is_default } = req.query;

    // Build query filters
    const filters = {};
    if (category) filters.category = category;
    if (institution) filters.institution = institution;
    if (is_default !== undefined) filters.is_default = is_default === 'true';

    // Fetch from JSON Store
    const templates = await TemplateStore.findAll(filters);

    return res.status(200).json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('Error listing templates:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to list templates',
      error: error.message
    });
  }
};

// Get template by ID
const getTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // In production, fetch from database:
    // const template = await Template.findByPk(id);

    // Mock data
    const template = {
      id: parseInt(id),
      name: 'Skripsi UI Standard',
      category: 'skripsi',
      institution: 'Universitas Indonesia',
      description: 'Format standar skripsi UI',
      master_file_path: '/templates/skripsi/ui_standard.docx',
      master_file_name: 'ui_standard.docx',
      rules_json: {
        global: {
          margins: { top: '4cm', bottom: '3cm', left: '3cm', right: '3cm' },
          font: { name: 'Times New Roman', size: '12pt' },
          line_spacing: '1.5'
        },
        sections: {
          abstract: {
            font_size: '11pt',
            line_spacing: '1.0',
            title_style: 'italic',
            max_words: 250
          },
          chapter_headings: {
            font_size: '14pt',
            font_weight: 'bold',
            text_transform: 'uppercase'
          }
        }
      },
      custom_prompt: 'Format standar skripsi UI: Margin 4-3-3-3, Font TNR 12pt, Spacing 1.5.',
      is_default: true,
      usage_count: 45,
      created_at: '2026-01-15T10:00:00Z'
    };

    return res.status(200).json({
      success: true,
      data: template
    });

  } catch (error) {
    console.error('Error getting template:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get template',
      error: error.message
    });
  }
};

// Update template
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      institution,
      description,
      rules_json,
      custom_prompt,
      is_default
    } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (institution !== undefined) updates.institution = institution;
    if (description !== undefined) updates.description = description;
    if (rules_json) {
      updates.rules_json = typeof rules_json === 'string' ? JSON.parse(rules_json) : rules_json;
    }
    if (custom_prompt !== undefined) updates.custom_prompt = custom_prompt;
    if (is_default !== undefined) updates.is_default = is_default;

    // If new file uploaded
    if (req.file) {
      updates.master_file_path = req.file.path;
      updates.master_file_name = req.file.filename;
    }

    // In production, update database:
    // await Template.update(updates, { where: { id } });

    console.log(`Template ${id} updated:`, updates);

    return res.status(200).json({
      success: true,
      message: 'Template updated successfully',
      data: { id: parseInt(id), ...updates }
    });

  } catch (error) {
    console.error('Error updating template:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error.message
    });
  }
};

// Delete template
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // In production:
    // 1. Check if template is being used
    // 2. Delete file from disk
    // 3. Delete from database

    console.log(`Template ${id} deleted`);

    return res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting template:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete template',
      error: error.message
    });
  }
};

// Set template as default
const setDefaultTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // In production:
    // 1. Get template category
    // 2. Unset all defaults in that category
    // 3. Set this template as default

    console.log(`Template ${id} set as default`);

    return res.status(200).json({
      success: true,
      message: 'Template set as default successfully'
    });

  } catch (error) {
    console.error('Error setting default template:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to set default template',
      error: error.message
    });
  }
};

// Get categories
const getCategories = async (req, res) => {
  try {
    const categories = [
      { value: 'skripsi', label: 'Skripsi', count: 5 },
      { value: 'tesis', label: 'Tesis', count: 3 },
      { value: 'makalah', label: 'Makalah', count: 2 },
      { value: 'laporan', label: 'Laporan', count: 1 }
    ];

    return res.status(200).json({
      success: true,
      data: categories
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get categories'
    });
  }
};

module.exports = {
  uploadTemplate,
  createTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
  getCategories
};
