const express = require('express');
const { handleShorten, handleRedirect } = require('../controllers/urlController');

const router = express.Router();

router.post('/shorten', handleShorten);
router.get('/:code', handleRedirect);

module.exports = router;

