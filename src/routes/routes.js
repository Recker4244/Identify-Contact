const Router = require('express');
const router = Router();
const contactController = require('../controllers/contact');
const validator = require('../utils/middleware/validation');

router.route('/identify')
  .post(validator.contactValidator, contactController.identifyContact);
module.exports = { router };