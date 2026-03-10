const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { verifyToken } = require('../middleware/authMiddleware');

// All group routes are protected
router.use(verifyToken);

router.post('/create', groupController.createGroup);
router.post('/join', groupController.joinGroup);
router.get('/list', groupController.getGroups);

module.exports = router;
