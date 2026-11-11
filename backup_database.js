require("dotenv/config");
const prisma = require('./lib/prisma');
const fs = require('fs');
const path = require('path');

async function backupDatabase() {
  console.log('🔄 Starting database backup...\n');

  const backupDir = path.join(__dirname, 'backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backup = {
    timestamp: new Date().toISOString(),
    tables: {}
  };

  // List of all tables to backup (from your schema - in dependency order)
  const tables = [
    'Counter',
    'SchoolConfiguration',
    'SchoolConfig',
    'SchoolCalendar',
    'Holiday',
    'BehavioralTrait',
    'NurseryAssessmentItem',
    'Subject',
    'SubjectLevel',
    'AcademicSession',
    'AcademicTerm',
    'Class',
    'Staff',
    'StaffFinancial',
    'Parent',
    'Student',
    'ClassSubject',
    'SubjectAssignment',
    'Schedule',
    'Enrollment',
    'Attendance',
    'BehavioralRating',
    'NurseryAssessment',
    'Result',
    'StudentTermRemark',
    'Bill',
    'BillClass',
    'BillStudent',
    'Invoice',
    'Payment',
    'BookPrice',
    'Expense',
    'IncomeRecord',
    'Communication',
    'CommunicationRead',
    'PromotionRun',
    'PromotionLog',
    'AuditLog',
    'AdmissionNumberPool',
    'Supplier',
    'InventoryItem',
    'StockIn',
    'StockOut',
    'RateLimitHit'
  ];

  let totalRecords = 0;

  for (const table of tables) {
    try {
      console.log(`📦 Backing up ${table}...`);
      const data = await prisma[table].findMany();
      backup.tables[table] = data;
      totalRecords += data.length;
      console.log(`   ✅ ${data.length} records`);
    } catch (error) {
      console.log(`   ⚠️  Error backing up ${table}: ${error.message}`);
      backup.tables[table] = [];
    }
  }

  // Write backup to file
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

  console.log(`\n✅ Backup complete!`);
  console.log(`📁 Backup file: ${backupFile}`);
  console.log(`📊 Total records: ${totalRecords}`);
  console.log(`📦 Tables backed up: ${Object.keys(backup.tables).length}`);

  return backupFile;
}

backupDatabase()
  .then(() => {
    console.log('\n✨ Backup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Backup failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
