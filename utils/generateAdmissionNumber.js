const prisma = require("../lib/prisma");

const PREFIX = "INPS";
const COUNTER_ID = "student_admission";

/**
 * Generates a unique student admission number.
 *
 * Format:  INPS/{ADMISSION_YEAR}/{GLOBAL_SEQUENCE}
 * Example: INPS/2024/001
 *
 * - Year reflects the actual year of admission.
 * - Prefers to reuse available admission numbers from the pool (same year only)
 * - Falls back to generating new numbers using global counter if pool is empty
 * - Pass a transaction client (tx) when calling inside $transaction()
 *   so the counter increment rolls back if the student create fails.
 *
 * @param {object} [tx] - Prisma transaction client
 * @returns {Promise<string>}
 */
const generateAdmissionNumber = async (tx) => {
	const client = tx ?? prisma;
	const year = new Date().getFullYear().toString();

	// First try to find an available number from the pool for the current year
	const availableNumber = await client.admissionNumberPool.findFirst({
		where: {
			isAvailable: true,
			year: year
		},
		orderBy: { createdAt: 'asc' } // Oldest first (FIFO)
	});

	if (availableNumber) {
		// Mark the number as taken
		await client.admissionNumberPool.update({
			where: { admissionNumber: availableNumber.admissionNumber },
			data: { isAvailable: false }
		});
		return availableNumber.admissionNumber;
	}

	// If no pool numbers, find the next available sequence number by checking existing students
	const existingStudents = await client.student.findMany({
		where: {
			admissionNumber: {
				startsWith: `${PREFIX}-${year}-`
			}
		},
		select: { admissionNumber: true }
	});

	// Extract existing sequence numbers
	const existingSequences = existingStudents
		.map(s => parseInt(s.admissionNumber.split('-')[2]))
		.filter(n => !isNaN(n));

	// Find the smallest unused sequence number starting from 1
	let nextSequence = 1;
	while (existingSequences.includes(nextSequence)) {
		nextSequence++;
	}

	const sequence = nextSequence.toString().padStart(3, "0");
	const admissionNumber = `${PREFIX}-${year}-${sequence}`;

	// Update counter to reflect the new sequence (for tracking purposes)
	await client.counter.upsert({
		where: { id: COUNTER_ID },
		create: { id: COUNTER_ID, value: nextSequence },
		update: { value: nextSequence },
	});

	return admissionNumber;
};

module.exports = generateAdmissionNumber;
