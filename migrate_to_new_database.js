require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const fs = require('fs');
const path = require('path');

// Old database connection (from .env)
const oldPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const oldPrisma = new PrismaClient({
  adapter: new PrismaPg(oldPool),
  transactionOptions: {
    timeout: 30000,
  },
});

// New database connection
const NEW_DATABASE_URL = 'postgres://d48b976f964df56cfd1e0028c6ef5cde23728b91183bb4a4dcf4e871813a2dab:sk_I6xl2vVulFwcKDTKIShXt@pooled.db.prisma.io:5432/postgres?sslmode=require';

const newPool = new Pool({
  connectionString: NEW_DATABASE_URL,
});

const newPrisma = new PrismaClient({
  adapter: new PrismaPg(newPool),
  transactionOptions: {
    timeout: 30000,
  },
});

// List of all tables to migrate (in dependency order)
const tables = [
  'Counter',
  'SchoolConfiguration',
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
  'RateLimitHit',
  'SchoolConfig' // Migrate last due to foreign key constraints
];

async function migrateData() {
  console.log('🔄 Starting database migration...\n');

  let totalMigrated = 0;
  let totalErrors = 0;

  for (const table of tables) {
    try {
      console.log(`📦 Migrating ${table}...`);

      // Read from old database
      const data = await oldPrisma[table].findMany();
      console.log(`   📥 Read ${data.length} records from old database`);

      if (data.length === 0) {
        console.log(`   ⏭️  Skipping (no data)\n`);
        continue;
      }

      // Write to new database
      let migratedCount = 0;
      try {
        // Special handling for SchoolConfig to handle foreign key constraints
        if (table === 'SchoolConfig') {
          for (const record of data) {
            try {
              await newPrisma[table].create({
                data: record
              });
              migratedCount++;
            } catch (error) {
              console.log(`   ⚠️  Error inserting SchoolConfig record: ${error.message}`);
              totalErrors++;
            }
          }
        } else {
          await newPrisma[table].createMany({
            data: data,
            skipDuplicates: true
          });
          migratedCount = data.length;
        }
      } catch (error) {
        console.log(`   ⚠️  Error migrating ${table}: ${error.message}`);
        totalErrors++;
      }

      totalMigrated += migratedCount;
      console.log(`   ✅ Migrated ${migratedCount} records\n`);

    } catch (error) {
      console.log(`   ❌ Error migrating ${table}: ${error.message}\n`);
      totalErrors++;
    }
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`📊 Total records migrated: ${totalMigrated}`);
  console.log(`❌ Total errors: ${totalErrors}`);
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...\n');

  let verificationPassed = true;

  for (const table of tables) {
    try {
      const oldCount = await oldPrisma[table].count();
      const newCount = await newPrisma[table].count();

      const match = oldCount === newCount;
      const status = match ? '✅' : '⚠️';

      console.log(`${status} ${table}: Old=${oldCount}, New=${newCount}`);

      if (!match) {
        verificationPassed = false;
      }
    } catch (error) {
      console.log(`❌ Error verifying ${table}: ${error.message}`);
      verificationPassed = false;
    }
  }

  if (verificationPassed) {
    console.log('\n✅ Verification passed - all data migrated successfully!');
  } else {
    console.log('\n⚠️  Verification failed - some data may be missing');
  }

  return verificationPassed;
}

async function main() {
  try {
    console.log('=== DATABASE MIGRATION TOOL ===\n');
    console.log('Old database:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@'));
    console.log('New database:', NEW_DATABASE_URL.replace(/:[^:]*@/, ':****@'));
    console.log('');

    // Test connections
    console.log('🔌 Testing database connections...');
    await oldPrisma.$connect();
    console.log('   ✅ Old database connected');
    await newPrisma.$connect();
    console.log('   ✅ New database connected\n');

    // Migrate data
    await migrateData();

    // Verify migration
    const verified = await verifyMigration();

    if (verified) {
      console.log('\n🎉 Migration successful!');
      console.log('\n📝 Next steps:');
      console.log('1. Update your .env file with the new DATABASE_URL');
      console.log('2. Test the application with the new database');
      console.log('3. If everything works, you can delete the old database');
    } else {
      console.log('\n⚠️  Please review the verification results above');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

main();
