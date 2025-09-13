const mongoose = require('mongoose');
const Book = require('./models/Book');
const BookEntry = require('./models/BookEntry');
const User = require('./models/User');
const Unit = require('./models/Unit');
const Department = require('./models/Department');
const Rank = require('./models/Rank');
const Position = require('./models/Position');
const bcrypt = require('bcryptjs');

async function createSampleData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/pmhuanluyen');
    console.log('Connected to MongoDB');
    
    // Lấy dữ liệu tham chiếu
    const unit = await Unit.findOne();
    const department = await Department.findOne();
    const rank = await Rank.findOne();
    const position = await Position.findOne();
    
    if (!unit || !department || !rank || !position) {
      console.log('Missing reference data. Please run seedData.js first');
      process.exit(1);
    }
    
    console.log('Found reference data:', {
      unit: unit.name,
      department: department.name,
      rank: rank.name,
      position: position.name
    });
    
    // Tạo sổ sách mẫu
    const books = await Book.find();
    if (books.length === 0) {
      const book1 = new Book({
        title: 'Sổ sách Quân sự 1',
        bookNumber: 'SS001',
        description: 'Sổ sách quản lý quân sự',
        unit: unit._id,
        department: department._id,
        isActive: true
      });
      await book1.save();
      
      const book2 = new Book({
        title: 'Sổ sách Quân sự 2',
        bookNumber: 'SS002',
        description: 'Sổ sách quản lý quân sự 2',
        unit: unit._id,
        department: department._id,
        isActive: true
      });
      await book2.save();
      
      console.log('Created 2 books');
      
      // Tạo mục sổ sách cho book1
      const bookEntry1 = new BookEntry({
        title: 'Mục 1: Báo cáo tuần',
        entryNumber: 'MS001',
        content: 'Nội dung báo cáo tuần',
        bookId: book1._id,
        entryDate: new Date()
      });
      await bookEntry1.save();
      
      const bookEntry2 = new BookEntry({
        title: 'Mục 2: Báo cáo tháng',
        entryNumber: 'MS002',
        content: 'Nội dung báo cáo tháng',
        bookId: book1._id,
        entryDate: new Date()
      });
      await bookEntry2.save();
      
      console.log('Created 2 book entries');
    }
    
    // Tạo user mẫu
    const users = await User.find();
    if (users.length === 0) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const user1 = new User({
        username: 'user1',
        email: 'user1@example.com',
        name: 'Người dùng 1',
        fullName: 'Người dùng 1',
        password: hashedPassword,
        role: 'staff',
        unit: unit._id,
        department: department._id,
        rank: rank._id,
        position: position._id,
        duty: 'Tham mưu',
        isActive: true
      });
      await user1.save();
      
      const user2 = new User({
        username: 'user2',
        email: 'user2@example.com',
        name: 'Người dùng 2',
        fullName: 'Người dùng 2',
        password: hashedPassword,
        role: 'staff',
        unit: unit._id,
        department: department._id,
        rank: rank._id,
        position: position._id,
        duty: 'Tham mưu',
        isActive: true
      });
      await user2.save();
      
      console.log('Created 2 users');
    }
    
    console.log('✅ Sample data ready!');
    console.log('You can now test the task assignment form');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createSampleData();



