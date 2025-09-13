const fs = require('fs');
const path = require('path');

// Danh sách các file routes cần thêm audit logging
const routeFiles = [
  'routes/users.js',
  'routes/departments.js',
  'routes/units.js',
  'routes/ranks.js',
  'routes/positions.js',
  'routes/books.js',
  'routes/bookEntries.js',
  'routes/notifications.js',
  'routes/reports.js'
];

// Hàm thêm audit logging vào file
function addAuditLogging(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Thêm import auditLogger nếu chưa có
    if (!content.includes('auditLogger')) {
      const importLine = "const auditLogger = require('../middleware/auditLogger');";
      
      // Tìm vị trí để thêm import
      const lastImportIndex = content.lastIndexOf("require('");
      if (lastImportIndex !== -1) {
        const nextLineIndex = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, nextLineIndex) + '\n' + importLine + content.slice(nextLineIndex);
      }
    }
    
    // Thêm auditLogger() vào các routes
    const routePatterns = [
      /router\.get\(['"`][^'"`]*['"`],\s*protect[^,]*,\s*restrictTo[^,]*,\s*async/g,
      /router\.post\(['"`][^'"`]*['"`],\s*protect[^,]*,\s*restrictTo[^,]*,\s*async/g,
      /router\.put\(['"`][^'"`]*['"`],\s*protect[^,]*,\s*restrictTo[^,]*,\s*async/g,
      /router\.delete\(['"`][^'"`]*['"`],\s*protect[^,]*,\s*restrictTo[^,]*,\s*async/g,
      /router\.get\(['"`][^'"`]*['"`],\s*protect[^,]*,\s*async/g,
      /router\.post\(['"`][^'"`]*['"`],\s*protect[^,]*,\s*async/g,
      /router\.put\(['"`][^'"`]*['"`],\s*protect[^,]*,\s*async/g,
      /router\.delete\(['"`][^'"`]*['"`],\s*protect[^,]*,\s*async/g
    ];
    
    routePatterns.forEach(pattern => {
      content = content.replace(pattern, (match) => {
        if (!match.includes('auditLogger()')) {
          return match.replace(', async', ', auditLogger(), async');
        }
        return match;
      });
    });
    
    // Ghi file đã được cập nhật
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Chạy script
console.log('🚀 Adding audit logging to route files...\n');

routeFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    addAuditLogging(filePath);
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('\n✨ Audit logging setup completed!');
