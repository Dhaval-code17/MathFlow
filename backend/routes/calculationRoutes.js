const express = require('express');
const router = express.Router();
const { saveCalculation, getHistory } = require('../controllers/calculationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/calculate', saveCalculation);
router.get('/history', getHistory);

module.exports = router;
