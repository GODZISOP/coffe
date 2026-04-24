const app = require('./src/app');
const { initExpo } = require('./src/config/expo');
const { startAutoBarista } = require('./src/services/autoBarista');
require('dotenv').config();

const port = process.env.PORT || 3001;

const startServer = async () => {
  // Initialize Expo
  await initExpo();
  
  // Start Server
  app.listen(port, () => {
    console.log(`☕ Ritual Backend running at http://localhost:${port}`);
    
    // Start Background Services
    startAutoBarista();
  });
};

startServer();
