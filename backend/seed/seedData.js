const mongoose = require('mongoose');
const Rank = require('../models/Rank');
const Unit = require('../models/Unit');
const Department = require('../models/Department');
const Position = require('../models/Position');
require('dotenv').config({ path: './.env' });

const seedData = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ MongoDB not connected, skipping seed data');
      return null;
    }

    console.log('✅ Using existing MongoDB connection');

    // Clear existing data
    await Rank.deleteMany({});
    await Unit.deleteMany({});
    await Department.deleteMany({});
    await Position.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create Ranks
    const ranks = [
      { name: 'Binh nhì', level: 1, category: 'Enlisted', description: 'Cấp bậc thấp nhất' },
      { name: 'Binh nhất', level: 2, category: 'Enlisted', description: 'Cấp bậc binh sĩ' },
      { name: 'Hạ sĩ', level: 3, category: 'NCO', description: 'Hạ sĩ quan' },
      { name: 'Trung sĩ', level: 4, category: 'NCO', description: 'Trung sĩ quan' },
      { name: 'Thượng sĩ', level: 5, category: 'NCO', description: 'Thượng sĩ quan' },
      { name: 'Thiếu úy', level: 6, category: 'Officer', description: 'Sĩ quan cấp thấp' },
      { name: 'Trung úy', level: 7, category: 'Officer', description: 'Sĩ quan trung cấp' },
      { name: 'Thượng úy', level: 8, category: 'Officer', description: 'Sĩ quan cao cấp' },
      { name: 'Đại úy', level: 9, category: 'Officer', description: 'Sĩ quan cao cấp' },
      { name: 'Thiếu tá', level: 10, category: 'Officer', description: 'Sĩ quan chỉ huy' },
      { name: 'Trung tá', level: 11, category: 'Officer', description: 'Sĩ quan chỉ huy' },
      { name: 'Thượng tá', level: 12, category: 'Officer', description: 'Sĩ quan chỉ huy' },
      { name: 'Đại tá', level: 13, category: 'General', description: 'Sĩ quan chỉ huy cao cấp' },
      { name: 'Thiếu tướng', level: 14, category: 'General', description: 'Tướng lĩnh' },
      { name: 'Trung tướng', level: 15, category: 'General', description: 'Tướng lĩnh cao cấp' },
      { name: 'Thượng tướng', level: 16, category: 'General', description: 'Tướng lĩnh cao cấp' },
      { name: 'Đại tướng', level: 17, category: 'General', description: 'Tướng lĩnh cao nhất' }
    ];

    const createdRanks = await Rank.insertMany(ranks);
    console.log('✅ Created ranks');

    // Create Departments
    const departments = [
      { name: 'Tham mưu', code: 'TM', description: 'Phòng tham mưu' },
      { name: 'Hậu cần', code: 'HC', description: 'Phòng hậu cần' },
      { name: 'Chính trị', code: 'CT', description: 'Phòng chính trị' },
      { name: 'Kỹ thuật', code: 'KT', description: 'Phòng kỹ thuật' },
      { name: 'Quân y', code: 'QY', description: 'Phòng quân y' },
      { name: 'Tài chính', code: 'TC', description: 'Phòng tài chính' },
      { name: 'Pháp chế', code: 'PC', description: 'Phòng pháp chế' },
      { name: 'Đối ngoại', code: 'DN', description: 'Phòng đối ngoại' },
      { name: 'Công nghệ thông tin', code: 'CNTT', description: 'Phòng công nghệ thông tin' },
      { name: 'An ninh', code: 'AN', description: 'Phòng an ninh' }
    ];

    const createdDepartments = await Department.insertMany(departments);
    console.log('✅ Created departments');

    // Create Units
    const units = [
      { name: 'Bộ Tham mưu', code: 'BTM', type: 'Quân đoàn', description: 'Bộ tham mưu quân đoàn' },
      { name: 'Sư đoàn 301', code: 'SD301', type: 'Sư đoàn', description: 'Sư đoàn 301' },
      { name: 'Lữ đoàn 101', code: 'LD101', type: 'Lữ đoàn', description: 'Lữ đoàn 101' },
      { name: 'Trung đoàn 201', code: 'TD201', type: 'Trung đoàn', description: 'Trung đoàn 201' },
      { name: 'Tiểu đoàn 401', code: 'TĐ401', type: 'Tiểu đoàn', description: 'Tiểu đoàn 401' },
      { name: 'Đại đội 501', code: 'ĐĐ501', type: 'Đại đội', description: 'Đại đội 501' },
      { name: 'Trung đội 601', code: 'TĐ601', type: 'Trung đội', description: 'Trung đội 601' },
      { name: 'Tiểu đội 701', code: 'TĐ701', type: 'Tiểu đội', description: 'Tiểu đội 701' }
    ];

    const createdUnits = await Unit.insertMany(units);
    console.log('✅ Created units');

    // Create Positions
    const positions = [
      { name: 'Quản trị viên', code: 'QTV', department: createdDepartments[0]._id, level: 'Executive', description: 'Quản trị hệ thống' },
      { name: 'Trưởng phòng Tham mưu', code: 'TPTM', department: createdDepartments[0]._id, level: 'Management', description: 'Trưởng phòng tham mưu' },
      { name: 'Sĩ quan Tham mưu', code: 'SOTM', department: createdDepartments[0]._id, level: 'Senior', description: 'Sĩ quan tham mưu' },
      { name: 'Trưởng phòng Hậu cần', code: 'TPHC', department: createdDepartments[1]._id, level: 'Management', description: 'Trưởng phòng hậu cần' },
      { name: 'Sĩ quan Hậu cần', code: 'SOHC', department: createdDepartments[1]._id, level: 'Senior', description: 'Sĩ quan hậu cần' },
      { name: 'Trưởng phòng Chính trị', code: 'TPCT', department: createdDepartments[2]._id, level: 'Management', description: 'Trưởng phòng chính trị' },
      { name: 'Sĩ quan Chính trị', code: 'SOCT', department: createdDepartments[2]._id, level: 'Senior', description: 'Sĩ quan chính trị' },
      { name: 'Trưởng phòng Kỹ thuật', code: 'TPKT', department: createdDepartments[3]._id, level: 'Management', description: 'Trưởng phòng kỹ thuật' },
      { name: 'Sĩ quan Kỹ thuật', code: 'SOKT', department: createdDepartments[3]._id, level: 'Senior', description: 'Sĩ quan kỹ thuật' },
      { name: 'Chiến sĩ', code: 'CS', department: createdDepartments[0]._id, level: 'Junior', description: 'Chiến sĩ' }
    ];

    const createdPositions = await Position.insertMany(positions);
    console.log('✅ Created positions');

    console.log('🎉 All data seeded successfully!');

    return {
      ranks: createdRanks,
      departments: createdDepartments,
      units: createdUnits,
      positions: createdPositions
    };

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  // Connect to MongoDB first if running directly
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/PMhuanluyen')
    .then(() => seedData())
    .then(() => mongoose.connection.close())
    .catch(console.error);
}

module.exports = seedData;
