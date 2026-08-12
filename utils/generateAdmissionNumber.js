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
 * - Sequence is global and never resets across years.
 * - Pass a transaction client (tx) when calling inside $transaction()
 *   so the counter increment rolls back if the student create fails.
 *
 * @param {object} [tx] - Prisma transaction client
 * @returns {Promise<string>}
 */
const generateAdmissionNumber = async (tx) => {
	const client = tx ?? prisma;
	const year = new Date().getFullYear().toString();

	const counter = await client.counter.upsert({
		where: { id: COUNTER_ID },
		create: { id: COUNTER_ID, value: 1 },
		update: { value: { increment: 1 } },
	});

	const sequence = counter.value.toString().padStart(3, "0");
	return `${PREFIX}-${year}-${sequence}`;
};

module.exports = generateAdmissionNumber;
