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

	// If no available numbers, generate new one using the counter
	const counter = await client.counter.upsert({
		where: { id: COUNTER_ID },
		create: { id: COUNTER_ID, value: 1 },
		update: { value: { increment: 1 } },
	});

	const sequence = counter.value.toString().padStart(3, "0");
	return `${PREFIX}-${year}-${sequence}`;
};

module.exports = generateAdmissionNumber;
