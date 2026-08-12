const prisma = require("../../lib/prisma");

async function migrateParentStructure() {
  try {
    console.log('Starting parent data migration...');
    
    // Get all existing parents
    const parents = await prisma.parent.findMany({
      where: { deletedAt: null }
    });
    
    console.log(`Found ${parents.length} parents to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const parent of parents) {
      try {
        // Build primary guardian from existing data
        const primaryGuardian = {
          relationship: 'Father',
          title: 'Mr.',
          firstName: parent.fatherFirstName || '',
          lastName: parent.fatherLastName || '',
          phone: parent.fatherPhone || parent.accountPhone || '',
          email: parent.fatherEmail || parent.accountEmail || '',
          occupation: parent.fatherOccupation || '',
          address: parent.address || ''
        };
        
        // If no father data, use mother data as primary
        if (!parent.fatherFirstName && parent.motherFirstName) {
          primaryGuardian.relationship = 'Mother';
          primaryGuardian.title = 'Mrs.';
          primaryGuardian.firstName = parent.motherFirstName || '';
          primaryGuardian.lastName = parent.motherLastName || '';
          primaryGuardian.phone = parent.motherPhone || parent.accountPhone || '';
          primaryGuardian.email = parent.motherEmail || parent.accountEmail || '';
          primaryGuardian.occupation = parent.motherOccupation || '';
        }
        
        // Build secondary guardian if data exists
        let secondaryGuardian = null;
        if (parent.fatherFirstName && parent.motherFirstName) {
          secondaryGuardian = {
            relationship: 'Mother',
            firstName: parent.motherFirstName || '',
            lastName: parent.motherLastName || '',
            phone: parent.motherPhone || '',
            email: parent.motherEmail || '',
            occupation: parent.motherOccupation || ''
          };
        }
        
        // Update parent with new structure
        await prisma.parent.update({
          where: { id: parent.id },
          data: {
            primaryGuardian: JSON.stringify(primaryGuardian),
            secondaryGuardian: secondaryGuardian ? JSON.stringify(secondaryGuardian) : null
          }
        });
        
        migratedCount++;
        console.log(`Migrated parent: ${parent.accountEmail} (Primary: ${primaryGuardian.firstName} ${primaryGuardian.lastName})`);
        
      } catch (error) {
        console.error(`Failed to migrate parent ${parent.accountEmail}:`, error);
        skippedCount++;
      }
    }
    
    console.log(`Migration complete: ${migratedCount} migrated, ${skippedCount} skipped`);
    console.log('⚠️  Database migration not applied yet. Run Prisma migration when DB connection is restored.');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run this when explicitly called, not automatically
if (require.main === module) {
  migrateParentStructure();
}

module.exports = { migrateParentStructure };
