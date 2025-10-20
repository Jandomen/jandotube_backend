const express = require('express');
const router = express.Router();
const { downloadMedia, getMediaInfo } = require('../controllers/downloadController');

router.post('/download', downloadMedia);
router.post('/info', getMediaInfo);

module.exports = router;
