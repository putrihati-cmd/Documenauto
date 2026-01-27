const express = require('express');
const router = express.Router();
const templateController = require('../controllers/template.controller');

// Template CRUD
router.post('/templates', 
  templateController.uploadTemplate.single('file'), 
  templateController.createTemplate
);

router.get('/templates', templateController.listTemplates);
router.get('/templates/categories', templateController.getCategories);
router.get('/templates/:id', templateController.getTemplate);

router.patch('/templates/:id', 
  templateController.uploadTemplate.single('file'), 
  templateController.updateTemplate
);

router.delete('/templates/:id', templateController.deleteTemplate);
router.post('/templates/:id/set-default', templateController.setDefaultTemplate);

module.exports = router;
