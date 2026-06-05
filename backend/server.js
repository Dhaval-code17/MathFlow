const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const { initDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const calculationRoutes = require('./routes/calculationRoutes');
const competitiveRoutes = require('./routes/competitiveRoutes');
const aiRoutes = require('./routes/aiRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Routes
app.use('/api', authRoutes);
app.use('/api', calculationRoutes);
app.use('/api', competitiveRoutes);
app.use('/api', aiRoutes);

// Catch-all route to serve React app for non-API requests
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Database and Server Initialization
const startServer = async () => {
    await initDB();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
