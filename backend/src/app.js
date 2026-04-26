const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'Ritual Backend Online', timestamp: new Date() });
});

// Root Route for Vercel
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Routes
app.use('/api/orders', orderRoutes);

module.exports = app;
