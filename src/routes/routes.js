const Router = require('express');
const router = Router();
const contactController = require('../controllers/contact');

router.route('/identify')
  .post(contactController.identifyContact);
module.exports = { router };