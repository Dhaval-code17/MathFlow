const express = require('express');
const router = express.Router();
const { saveCompetitiveScore, getLeaderboard, getMyCompetitiveStats, getCalculationAnalytics } = require('../controllers/competitiveController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/competitive/score', saveCompetitiveScore);
router.get('/competitive/leaderboard', getLeaderboard);
router.get('/competitive/mystats', getMyCompetitiveStats);
router.get('/analytics', getCalculationAnalytics);

module.exports = router;
