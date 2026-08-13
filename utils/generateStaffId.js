const prisma = require("../lib/prisma");

const PREFIX = "INPS";

const ROLE_ABBREVIATIONS = {
	TEACHER: "TCH",
	ADMIN: "ADM",
	HEAD_TEACHER: "HTR",
	BURSARY: "BUR",
	STOREKEEPER: "STK",
};

/**
 * Generates a unique staff ID.
 *
 * Format:  INPS/{ROLE_ABBR}/{JOINING_YEAR}/{GLOBAL_SEQUENCE_PER_ROLE}
 * Example: INPS/TCH/2024/001
 *
 * - Sequence is global per role abbreviation and never resets.
 * - Pass a transaction client (tx) when calling inside $transaction().
 *
 * @param {string} role  - StaffRole enum value e.g. "TEACHER"
 * @param {object} [tx]  - Prisma transaction client
 * @returns {Promise<string>}
 */
const generateStaffId = async (role, tx) => {
	const client = tx ?? prisma;
	const abbr = ROLE_ABBREVIATIONS[role];

	if (!abbr) {
		throw new Error(
			`generateStaffId: unknown role "${role}". ` +
				`Valid roles: ${Object.keys(ROLE_ABBREVIATIONS).join(", ")}`,
		);
	}

	const year = new Date().getFullYear().toString();

	const counter = await client.counter.upsert({
		where: { id: `staff_${abbr}` },
		create: { id: `staff_${abbr}`, value: 1 },
		update: { value: { increment: 1 } },
	});

	const sequence = counter.value.toString().padStart(3, "0");
	return `${PREFIX}-${abbr}-${year}-${sequence}`;
};

module.exports = generateStaffId;
