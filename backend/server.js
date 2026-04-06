const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes        = require('./routes/auth');
const jobRoutes         = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const profileRoutes     = require('./routes/profile');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));           // increased for base64 photos
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// -------- API Routes --------
app.use('/api', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/profile', profileRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// -------- API 404 catch-all (MUST come AFTER all /api routes) --------
// This prevents unknown /api/* requests from falling through to static
// files which would return HTML → causing "Unexpected token '<'" errors.
// Express v5 requires named wildcard params, so we use a middleware instead.
app.use('/api', (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
});

// MongoDB Connection
const net = require('net');
const { MongoMemoryServer } = require('mongodb-memory-server');

function checkPort(port, host) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => { resolve(false); });
    socket.connect(port, host);
  });
}

let globalMongoServer = null;

async function connectDB() {
  try {
    let uri = process.env.MONGO_URI;
    if (uri && uri.includes('localhost:27017')) {
      const isUp = await checkPort(27017, '127.0.0.1');
      if (!isUp) {
        console.log('Local MongoDB not running. Spinning up in-memory MongoDB...');
        globalMongoServer = await MongoMemoryServer.create();
        uri = globalMongoServer.getUri();
      }
    }
    await mongoose.connect(uri);
    console.log('MongoDB successfully connected at', uri);

    mongoose.connection.on('disconnected', () => console.log('Mongoose DISCONNECTED!'));
    mongoose.connection.on('error', (e) => console.log('Mongoose ERROR:', e));
  } catch (err) {
    console.log('MongoDB connection error: ', err);
  }
}

connectDB().then(() => {
  // Health check
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', readyState: mongoose.connection.readyState });
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
