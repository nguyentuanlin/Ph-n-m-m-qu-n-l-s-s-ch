const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Load environment variables
dotenv.config({ path: './.env' });

// Set default environment variables if .env doesn't exist
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your-super-secret-jwt-key-here-make-it-very-long-and-secure';
}
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/PMhuanluyen';
}
if (!process.env.PORT) {
  process.env.PORT = '5002';
}
if (!process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL = 'http://localhost:3000';
}

// Import database connection
const connectDB = require('./config/mongodb');

// Import seed functions
const seedData = require('./seed/seedData');
const createAdminUser = require('./seed/adminUser');

// Import Swagger
const { swaggerUi, specs } = require('./config/swagger');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const bookRoutes = require('./routes/books');
const bookEntryRoutes = require('./routes/bookEntries');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const rankRoutes = require('./routes/ranks');
const unitRoutes = require('./routes/units');
const departmentRoutes = require('./routes/departments');
const positionRoutes = require('./routes/positions');
const auditLogRoutes = require('./routes/auditLogs');
const taskAssignmentRoutes = require('./routes/taskAssignments');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import services
const reminderService = require('./services/reminderService');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to MongoDB
connectDB();

// Seed data and create admin user (disabled - user will create manually)
// const initializeData = async () => {
//   try {
//     // First seed reference data
//     await seedData();
//     // Then create admin user
//     await createAdminUser();
//   } catch (error) {
//     console.error('Error initializing data:', error);
//   }
// };

// initializeData();

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Hệ thống quản lý sổ sách API'
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/entries', bookEntryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ranks', rankRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/task-assignments', taskAssignmentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Schedule daily reminder check
cron.schedule('0 8 * * *', () => {
  console.log('Running daily reminder check...');
  // TODO: Implement daily reminder logic
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
});
