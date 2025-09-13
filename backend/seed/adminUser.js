const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Rank = require('../models/Rank');
const Unit = require('../models/Unit');
const Department = require('../models/Department');
const Position = require('../models/Position');
require('dotenv').config({ path: './.env' });

const createAdminUser = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ MongoDB not connected, skipping admin user creation');
      return null;
    }

    console.log('✅ Using existing MongoDB connection');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists:', existingAdmin.email);
      return existingAdmin;
    }

    // Find required references
    const adminRank = await Rank.findOne({ name: 'Đại tá' });
    const adminUnit = await Unit.findOne({ name: 'Bộ Tham mưu' });
    const adminDepartment = await Department.findOne({ name: 'Tham mưu' });
    const adminPosition = await Position.findOne({ name: 'Quản trị viên' });

    if (!adminRank || !adminUnit || !adminDepartment || !adminPosition) {
      console.log('❌ Required reference data not found. Please run seed data first.');
      return null;
    }

    // Create default admin user
    const adminData = {
      username: 'admin',
      email: 'admin@quandoi.vn',
      password: 'admin123456',
      fullName: 'Quản trị viên hệ thống',
      rank: adminRank._id,
      unit: adminUnit._id,
      department: adminDepartment._id,
      position: adminPosition._id,
      duty: 'Tham mưu',
      role: 'admin',
      phone: '+84-901-234-567',
      isActive: true
    };

    // Create admin user (password will be hashed by pre-save hook)
    const adminUser = new User(adminData);

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('⚠️  Please change the password after first login!');

    return adminUser;

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  // Connect to MongoDB first if running directly
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/PMhuanluyen')
    .then(() => createAdminUser())
    .then(() => mongoose.connection.close())
    .catch(console.error);
}

module.exports = createAdminUser;
