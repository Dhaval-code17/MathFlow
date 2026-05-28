const { pool } = require('../config/db');

// Save a competitive mode score
const saveCompetitiveScore = async (req, res) => {
    const { score, bestStreak, accuracy, totalCorrect, totalAttempted, maxDifficulty } = req.body;

    if (score === undefined) {
        return res.status(400).json({ message: 'Score is required' });
    }

    try {
        await pool.query(
            `INSERT INTO competitive_scores (user_id, score, best_streak, accuracy, total_correct, total_attempted, max_difficulty)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, score, bestStreak || 0, accuracy || 0, totalCorrect || 0, totalAttempted || 0, maxDifficulty || 'easy']
        );
        res.status(201).json({ message: 'Score saved' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get leaderboard (top scores across all users)
const getLeaderboard = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT cs.score, cs.best_streak, cs.accuracy, cs.max_difficulty, cs.created_at,
                    u.username
             FROM competitive_scores cs
             JOIN users u ON cs.user_id = u.id
             ORDER BY cs.score DESC
             LIMIT 20`
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user's personal competitive stats
const getMyCompetitiveStats = async (req, res) => {
    try {
        // Best score
        const [best] = await pool.query(
            `SELECT MAX(score) as bestScore, COUNT(*) as totalGames,
                    AVG(score) as avgScore, AVG(accuracy) as avgAccuracy,
                    MAX(best_streak) as longestStreak
             FROM competitive_scores WHERE user_id = ?`,
            [req.user.id]
        );

        // Recent games
        const [recent] = await pool.query(
            `SELECT score, best_streak, accuracy, total_correct, total_attempted, max_difficulty, created_at
             FROM competitive_scores WHERE user_id = ?
             ORDER BY created_at DESC LIMIT 10`,
            [req.user.id]
        );

        // User's rank
        const [rankResult] = await pool.query(
            `SELECT COUNT(DISTINCT user_id) + 1 as userRank
             FROM competitive_scores
             WHERE score > COALESCE((SELECT MAX(score) FROM competitive_scores WHERE user_id = ?), 0)`,
            [req.user.id]
        );

        res.json({
            stats: best[0] || {},
            recentGames: recent,
            rank: rankResult[0]?.userRank || 1,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user's calculation analytics
const getCalculationAnalytics = async (req, res) => {
    try {
        // Total calculations
        const [total] = await pool.query(
            `SELECT COUNT(*) as totalCalcs FROM calculations WHERE user_id = ?`,
            [req.user.id]
        );

        // Calculations per day (last 7 days)
        const [daily] = await pool.query(
            `SELECT DATE(created_at) as day, COUNT(*) as count
             FROM calculations WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY DATE(created_at) ORDER BY day`,
            [req.user.id]
        );

        // Most used operators
        const [allCalcs] = await pool.query(
            `SELECT expression FROM calculations WHERE user_id = ?`,
            [req.user.id]
        );

        const opCounts = { '+': 0, '-': 0, '*': 0, '/': 0 };
        allCalcs.forEach(c => {
            const ops = (c.expression || '').match(/[+\-*/]/g) || [];
            ops.forEach(op => { if (opCounts[op] !== undefined) opCounts[op]++; });
        });

        res.json({
            totalCalcs: total[0]?.totalCalcs || 0,
            dailyActivity: daily,
            operatorUsage: opCounts,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { saveCompetitiveScore, getLeaderboard, getMyCompetitiveStats, getCalculationAnalytics };
