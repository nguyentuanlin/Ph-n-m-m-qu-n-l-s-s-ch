const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config({ path: './.env' });

const militaryUsers = [
  {
    username: 'admin001',
    email: 'admin@quandoi.vn',
    password: '12345678',
    fullName: 'Nguyễn Văn Admin',
    rank: 'Đại tá',
    unit: 'Bộ Tham mưu',
    department: 'Tham mưu',
    position: 'Trưởng phòng Tham mưu',
    duty: 'Tham mưu',
    role: 'admin',
    phone: '+84-901-234-567'
  },
  {
    username: 'chihuy001',
    email: 'chihuy@quandoi.vn',
    password: '12345678',
    fullName: 'Trần Văn Chỉ huy',
    rank: 'Thiếu tá',
    unit: 'Tiểu đoàn 301',
    department: 'Tham mưu',
    position: 'Tiểu đoàn trưởng',
    duty: 'Huấn luyện',
    role: 'commander',
    phone: '+84-902-345-678'
  },
  {
    username: 'haucan001',
    email: 'haucan@quandoi.vn',
    password: '12345678',
    fullName: 'Lê Văn Hậu cần',
    rank: 'Đại úy',
    unit: 'Tiểu đoàn 301',
    department: 'Hậu cần',
    position: 'Trưởng phòng Hậu cần',
    duty: 'Hậu cần',
    role: 'logistic',
    phone: '+84-903-456-789'
  },
  {
    username: 'binhsi001',
    email: 'binhsi@quandoi.vn',
    password: '12345678',
    fullName: 'Phạm Văn Binh sĩ',
    rank: 'Binh nhì',
    unit: 'Tiểu đoàn 301',
    department: 'Huấn luyện',
    position: 'Chiến sĩ',
    duty: 'Huấn luyện',
    role: 'staff',
    phone: '+84-904-567-890'
  },
  {
    username: 'trungsi001',
    email: 'trungsi@quandoi.vn',
    password: '12345678',
    fullName: 'Hoàng Văn Trung sĩ',
    rank: 'Trung sĩ',
    unit: 'Tiểu đoàn 301',
    department: 'Huấn luyện',
    position: 'Trung đội trưởng',
    duty: 'Huấn luyện',
    role: 'staff',
    phone: '+84-905-678-901'
  },
  {
    username: 'thieuuy001',
    email: 'thieuuy@quandoi.vn',
    password: '12345678',
    fullName: 'Vũ Văn Thiếu úy',
    rank: 'Thiếu úy',
    unit: 'Tiểu đoàn 301',
    department: 'Kỹ thuật',
    position: 'Sĩ quan kỹ thuật',
    duty: 'Kỹ thuật',
    role: 'staff',
    phone: '+84-906-789-012'
  }
];

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/PMhuanluyen');
    console.log('✅ Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️ Cleared existing users');

    // Hash passwords and create users
    for (const userData of militaryUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      await user.save();
      console.log(`✅ Created user: ${userData.fullName} (${userData.rank})`);
    }

    console.log('🎉 Military users seeded successfully!');
    console.log('\n📋 Test accounts:');
    console.log('Admin: admin@quandoi.vn / 12345678');
    console.log('Chỉ huy: chihuy@quandoi.vn / 12345678');
    console.log('Hậu cần: haucan@quandoi.vn / 12345678');
    console.log('Binh sĩ: binhsi@quandoi.vn / 12345678');
    console.log('Trung sĩ: trungsi@quandoi.vn / 12345678');
    console.log('Thiếu úy: thieuuy@quandoi.vn / 12345678');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  seedUsers();
}

module.exports = seedUsers;
