require('dotenv').config();

const http    = require('http');
const path    = require('path');
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');

const config   = require('./config');
const authRouter   = require('./routes/auth');
const menuRouter   = require('./routes/menu');
const ordersRouter = require('./routes/orders');
const kitchenRouter = require('./routes/kitchen');
const ownerRouter  = require('./routes/owner');
const uploadRouter = require('./routes/upload');
const { errorHandler } = require('./middleware/errorHandler');
const { attachWebSocket } = require('./websocket');

// ── Express app ───────────────────────────────────────────
const app = express();

// Security headers
// crossOriginResourcePolicy = cross-origin → ให้ /uploads/* โหลดข้าม origin ได้ (frontend คนละโดเมน)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || config.cors.origins.includes(origin) || !config.isProd) {
      return cb(null, true);
    }
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Request logging
app.use(morgan(config.isProd ? 'combined' : 'dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy (for rate limiting + IP logging behind nginx/load balancer)
app.set('trust proxy', 1);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', apiLimiter);

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later' },
});
app.use('/auth/', authLimiter);

// Static: เสิร์ฟไฟล์รูปที่อัปโหลด
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads'), {
  maxAge: '7d',
  immutable: false,
}));

// ── Routes ────────────────────────────────────────────────
app.use('/auth',         authRouter);
app.use('/api/menu',     menuRouter);
app.use('/api/orders',   ordersRouter);
app.use('/api/kitchen',  kitchenRouter);
app.use('/api/owner',    ownerRouter);
app.use('/api/upload',   uploadRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: config.nodeEnv });
});

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Central error handler (must be last)
app.use(errorHandler);

// ── HTTP + WebSocket server ───────────────────────────────
const server = http.createServer(app);
const broadcast = attachWebSocket(server);

// Make broadcast available to route handlers via app.locals
app.locals.broadcast = broadcast;

// ── Start ─────────────────────────────────────────────────
server.listen(config.port, () => {
  console.log('');
  console.log("  🍜  Per's Restaurant API");
  console.log(`  ➜  http://localhost:${config.port}`);
  console.log(`  ➜  ws://localhost:${config.port}/ws`);
  console.log(`  ➜  ENV: ${config.nodeEnv}`);
  console.log('');
});

server.on('error', (err) => {
  console.error('[server] Fatal error:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[server] SIGTERM received, shutting down gracefully...');
  server.close(() => process.exit(0));
});
