const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { invalidateCurriculumOnWrite } = require('./services/curriculumCache');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

const app = express();

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'development' ? false : undefined,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));

// CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow any localhost, Vercel, or Netlify URL to prevent deployment friction
    if (!origin || 
        origin.includes('localhost') || 
        origin.includes('vercel.app') || 
        origin.includes('netlify.app') || 
        origin === process.env.CLIENT_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 10000 : 200,
  message: { success: false, message: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// Routes
app.use(["/api/domains", "/api/phases", "/api/topics"], invalidateCurriculumOnWrite);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/domains', require('./routes/domains'));
app.use('/api/phases', require('./routes/phases'));
app.use('/api/topics', require('./routes/topics'));
app.use('/api/guest-explore', require('./routes/guestExplore'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/academics', require('./routes/academics'));
app.use('/api/admin/academics', require('./routes/adminAcademics'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/badges', require('./routes/badges'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/cloud-credits', require('./routes/cloudCredits'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/analytics', require('./routes/adminAnalyticsRoutes'));
app.use('/api/device', require('./routes/deviceAnalyticsRoutes'));
app.use('/api/problems', require('./routes/problemRoutes'));
app.use('/api/code', require('./routes/codeRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/jobs', require('./routes/jobs'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'CareerForge API is running', timestamp: new Date() });
});

// Error handler
app.use(errorHandler);

// Connect to database and then start server
const startServer = async () => {
  try {
    await connectDB();
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`\n🔥 CareerForge Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 Client URL: ${process.env.CLIENT_URL}\n`);

    });
  } catch (err) {
    console.error('❌ Server startup failed:', err.message);
    process.exit(1);
  }
};

startServer();

// Triggering restart for port configuration changes!
