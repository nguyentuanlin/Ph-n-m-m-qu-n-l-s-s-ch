const mongoose = require('mongoose');
const Rank = require('../models/Rank');
const Unit = require('../models/Unit');
const Department = require('../models/Department');
const Position = require('../models/Position');
require('dotenv').config({ path: './.env' });

const seedMilitaryData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/PMhuanluyen');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Rank.deleteMany({}),
      Unit.deleteMany({}),
      Department.deleteMany({}),
      Position.deleteMany({})
    ]);
    console.log('🗑️ Cleared existing military data');

    // Seed Ranks
    const ranks = [
      // Enlisted
      { name: 'Binh nhì', level: 1, category: 'Enlisted', description: 'Cấp bậc thấp nhất' },
      { name: 'Binh nhất', level: 2, category: 'Enlisted', description: 'Binh nhì có kinh nghiệm' },
      
      // NCO (Non-Commissioned Officers)
      { name: 'Hạ sĩ', level: 3, category: 'NCO', description: 'Hạ sĩ quan' },
      { name: 'Trung sĩ', level: 4, category: 'NCO', description: 'Trung sĩ quan' },
      { name: 'Thượng sĩ', level: 5, category: 'NCO', description: 'Thượng sĩ quan' },
      
      // Officers
      { name: 'Thiếu úy', level: 6, category: 'Officer', description: 'Sĩ quan cấp thấp' },
      { name: 'Trung úy', level: 7, category: 'Officer', description: 'Sĩ quan trung cấp' },
      { name: 'Thượng úy', level: 8, category: 'Officer', description: 'Sĩ quan cao cấp' },
      { name: 'Đại úy', level: 9, category: 'Officer', description: 'Sĩ quan cấp cao' },
      { name: 'Thiếu tá', level: 10, category: 'Officer', description: 'Sĩ quan cấp tá' },
      { name: 'Trung tá', level: 11, category: 'Officer', description: 'Sĩ quan cấp tá' },
      { name: 'Thượng tá', level: 12, category: 'Officer', description: 'Sĩ quan cấp tá' },
      { name: 'Đại tá', level: 13, category: 'Officer', description: 'Sĩ quan cấp tá cao nhất' },
      
      // Generals
      { name: 'Thiếu tướng', level: 14, category: 'General', description: 'Tướng cấp thấp' },
      { name: 'Trung tướng', level: 15, category: 'General', description: 'Tướng cấp trung' },
      { name: 'Thượng tướng', level: 16, category: 'General', description: 'Tướng cấp cao' },
      { name: 'Đại tướng', level: 17, category: 'General', description: 'Tướng cấp cao nhất' }
    ];

    const createdRanks = await Rank.insertMany(ranks);
    console.log(`✅ Created ${createdRanks.length} ranks`);

    // Seed Departments
    const departments = [
      { name: 'Tham mưu', code: 'TM', description: 'Phòng Tham mưu' },
      { name: 'Hậu cần', code: 'HC', description: 'Phòng Hậu cần' },
      { name: 'Chính trị', code: 'CT', description: 'Phòng Chính trị' },
      { name: 'Kỹ thuật', code: 'KT', description: 'Phòng Kỹ thuật' },
      { name: 'Quân y', code: 'QY', description: 'Phòng Quân y' },
      { name: 'Tài chính', code: 'TC', description: 'Phòng Tài chính' },
      { name: 'Pháp chế', code: 'PC', description: 'Phòng Pháp chế' },
      { name: 'Đối ngoại', code: 'DN', description: 'Phòng Đối ngoại' },
      { name: 'Công nghệ thông tin', code: 'CNTT', description: 'Phòng Công nghệ thông tin' },
      { name: 'An ninh', code: 'AN', description: 'Phòng An ninh' },
      { name: 'Huấn luyện', code: 'HL', description: 'Phòng Huấn luyện' }
    ];

    const createdDepartments = await Department.insertMany(departments);
    console.log(`✅ Created ${createdDepartments.length} departments`);

    // Seed Units
    const units = [
      { name: 'Tiểu đoàn 301', code: 'TĐ301', type: 'Tiểu đoàn', location: 'Hà Nội' },
      { name: 'Tiểu đoàn 302', code: 'TĐ302', type: 'Tiểu đoàn', location: 'TP.HCM' },
      { name: 'Đại đội 1', code: 'ĐĐ1', type: 'Đại đội', location: 'Hà Nội' },
      { name: 'Đại đội 2', code: 'ĐĐ2', type: 'Đại đội', location: 'TP.HCM' },
      { name: 'Trung đội 1', code: 'TĐ1', type: 'Trung đội', location: 'Hà Nội' },
      { name: 'Trung đội 2', code: 'TĐ2', type: 'Trung đội', location: 'TP.HCM' }
    ];

    const createdUnits = await Unit.insertMany(units);
    console.log(`✅ Created ${createdUnits.length} units`);

    // Seed Positions
    const positions = [
      // Tham mưu positions
      { name: 'Trưởng phòng Tham mưu', code: 'TPTM', department: createdDepartments[0]._id, level: 'Management' },
      { name: 'Sĩ quan Tham mưu', code: 'SOTM', department: createdDepartments[0]._id, level: 'Senior' },
      { name: 'Nhân viên Tham mưu', code: 'NVTM', department: createdDepartments[0]._id, level: 'Junior' },
      
      // Hậu cần positions
      { name: 'Trưởng phòng Hậu cần', code: 'TPHC', department: createdDepartments[1]._id, level: 'Management' },
      { name: 'Sĩ quan Hậu cần', code: 'SOHC', department: createdDepartments[1]._id, level: 'Senior' },
      { name: 'Nhân viên Hậu cần', code: 'NVHC', department: createdDepartments[1]._id, level: 'Junior' },
      
      // Chính trị positions
      { name: 'Chính trị viên', code: 'CTV', department: createdDepartments[2]._id, level: 'Management' },
      { name: 'Sĩ quan Chính trị', code: 'SOCT', department: createdDepartments[2]._id, level: 'Senior' },
      
      // Kỹ thuật positions
      { name: 'Trưởng phòng Kỹ thuật', code: 'TPKT', department: createdDepartments[3]._id, level: 'Management' },
      { name: 'Sĩ quan Kỹ thuật', code: 'SOKT', department: createdDepartments[3]._id, level: 'Senior' },
      { name: 'Kỹ thuật viên', code: 'KTV', department: createdDepartments[3]._id, level: 'Junior' },
      
      // Huấn luyện positions
      { name: 'Tiểu đoàn trưởng', code: 'TĐT', department: createdDepartments[10]._id, level: 'Management' },
      { name: 'Đại đội trưởng', code: 'ĐĐT', department: createdDepartments[10]._id, level: 'Senior' },
      { name: 'Trung đội trưởng', code: 'TĐT', department: createdDepartments[10]._id, level: 'Junior' },
      { name: 'Chiến sĩ', code: 'CS', department: createdDepartments[10]._id, level: 'Junior' }
    ];

    const createdPositions = await Position.insertMany(positions);
    console.log(`✅ Created ${createdPositions.length} positions`);

    console.log('\n🎉 Military data seeded successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Ranks: ${createdRanks.length}`);
    console.log(`- Departments: ${createdDepartments.length}`);
    console.log(`- Units: ${createdUnits.length}`);
    console.log(`- Positions: ${createdPositions.length}`);

    console.log('\n📝 Sample IDs for testing:');
    console.log(`Rank (Đại úy): ${createdRanks.find(r => r.name === 'Đại úy')._id}`);
    console.log(`Unit (Tiểu đoàn 301): ${createdUnits.find(u => u.name === 'Tiểu đoàn 301')._id}`);
    console.log(`Department (Tham mưu): ${createdDepartments.find(d => d.name === 'Tham mưu')._id}`);
    console.log(`Position (Tiểu đoàn trưởng): ${createdPositions.find(p => p.name === 'Tiểu đoàn trưởng')._id}`);

  } catch (error) {
    console.error('❌ Error seeding military data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  seedMilitaryData();
}

module.exports = seedMilitaryData;
