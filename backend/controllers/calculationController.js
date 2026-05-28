const { pool } = require('../config/db');

const saveCalculation = async (req, res) => {
    const { expression, result } = req.body;

    if (!expression || !result) {
        return res.status(400).json({ message: 'Please provide expression and result' });
    }

    try {
        await pool.query(
            'INSERT INTO calculations (user_id, expression, result) VALUES (?, ?, ?)',
            [req.user.id, expression, result]
        );
        res.status(201).json({ message: 'Calculation saved' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getHistory = async (req, res) => {
    try {
        const [calculations] = await pool.query(
            'SELECT * FROM calculations WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(calculations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { saveCalculation, getHistory };
