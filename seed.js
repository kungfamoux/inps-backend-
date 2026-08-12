require("dotenv").config();
const prisma = require("./lib/prisma");
const AuthRepository = require("./shared/repositories/AuthRepository");
const generateStaffId = require("./utils/generateStaffId");
const logger = require("./utils/logger");

// COUNTERS

const COUNTERS = [
	{ id: "student_admission" },
	{ id: "staff_TCH" },
	{ id: "staff_ADM" },
	{ id: "staff_HTR" }, // HEAD_TEACHER
	{ id: "staff_BUR" },
	{ id: "staff_STK" },
	{ id: "staff_SUP" },
	{ id: "invoice" },
	{ id: "stockin" },
	{ id: "stockout" },
];

// INITIAL ADMINS
// Set in .env before first deploy.
// Default password = phone number (digits only).

const INITIAL_ADMINS = [
	{
		firstName: "Super",
		lastName: "Admin",
		email: process.env.ADMIN_1_EMAIL,
		phone: process.env.ADMIN_1_PHONE,
		gender: "MALE",
	},
	{
		firstName: "Second",
		lastName: "Admin",
		email: process.env.ADMIN_2_EMAIL,
		phone: process.env.ADMIN_2_PHONE,
		gender: "FEMALE",
	},
];

// SCHOOL STRUCTURE
// Flat structure - each classroom is its own Class entity

const CLASS_STRUCTURE = [
	{ name: "Daycare", color: null },
	{ name: "Pre-nursery A", color: null },
	{ name: "Pre-nursery B", color: null },
	{ name: "Nursery 1A", color: null },
	{ name: "Nursery 1B", color: null },
	{ name: "Nursery 2A", color: null },
	{ name: "Nursery 2B", color: null },
	{ name: "Nursery 2C", color: null },
	{ name: "Nursery 3A", color: null },
	{ name: "Nursery 3B", color: null },
	{ name: "Nursery 3C", color: null },
	{ name: "Primary 1 Yellow", color: "YELLOW" },
	{ name: "Primary 1 Blue", color: "BLUE" },
	{ name: "Primary 1 Green", color: "GREEN" },
	{ name: "Primary 2 Yellow", color: "YELLOW" },
	{ name: "Primary 2 Blue", color: "BLUE" },
	{ name: "Primary 2 Green", color: "GREEN" },
	{ name: "Primary 3 Yellow", color: "YELLOW" },
	{ name: "Primary 3 Blue", color: "BLUE" },
	{ name: "Primary 3 Green", color: "GREEN" },
	{ name: "Primary 4 Yellow", color: "YELLOW" },
	{ name: "Primary 4 Blue", color: "BLUE" },
	{ name: "Primary 4 Green", color: "GREEN" },
	{ name: "Primary 5 Yellow", color: "YELLOW" },
	{ name: "Primary 5 Blue", color: "BLUE" },
	{ name: "Primary 5 Green", color: "GREEN" },
	{ name: "Primary 6 Rainbow", color: "RAINBOW" },
];

// SUBJECTS
// Primary 1-6 share the same 16 subjects.
// Nursery (Daycare, Pre-Nursery, Nursery 1-3)
// share the same 12 subjects from the report card.

const PRIMARY_LEVELS = [
	"PRIMARY_1",
	"PRIMARY_2",
	"PRIMARY_3",
	"PRIMARY_4",
	"PRIMARY_5",
	"PRIMARY_6",
];

const NURSERY_LEVELS = [
	"DAYCARE",
	"PRENURSERY",
	"NURSERY_1",
	"NURSERY_2",
	"NURSERY_3",
];

const PRIMARY_SUBJECTS = [
	{ name: "English Studies", code: "ENG" },
	{ name: "Mathematics", code: "MTH" },
	{ name: "Christian Religious Studies", code: "CRS" },
	{ name: "Basic Science", code: "BSC" },
	{ name: "Physical and Health Education", code: "PHE" },
	{ name: "Home Economics", code: "HEC" },
	{ name: "Igbo Studies", code: "IGB" },
	{ name: "Social Studies", code: "SST" },
	{ name: "Civic Education", code: "CIV" },
	{ name: "Agric Science", code: "AGR" },
	{ name: "Cultural and Creative Art", code: "CCA" },
	{ name: "Handwriting & Dictation", code: "HWD" },
	{ name: "Computer Studies", code: "CMP" },
	{ name: "Music", code: "MUS" },
	{ name: "Phonics", code: "PHO" },
	{ name: "French", code: "FRN" },
];

// From nursery report card (image 2)
const NURSERY_SUBJECTS = [
	{ name: "English Studies", code: "NRS-ENG" },
	{ name: "Mathematics", code: "NRS-MTH" },
	{ name: "Igbo", code: "NRS-IGB" },
	{ name: "Science", code: "NRS-SCI" },
	{ name: "Social Norms", code: "NRS-SOC" },
	{ name: "C.R.S", code: "NRS-CRS" },
	{ name: "Health Habit", code: "NRS-HLT" },
	{ name: "Creative Arts", code: "NRS-CRT" },
	{ name: "Hand Writing", code: "NRS-HWR" },
	{ name: "Phonics", code: "NRS-PHO" },
	{ name: "General Knowledge", code: "NRS-GNK" },
	{ name: "Colouring", code: "NRS-COL" },
];

// NURSERY ASSESSMENT ITEMS
// From nursery report card — Y/N/S ratings

const NURSERY_ASSESSMENT_ITEMS = [
	// Reading Activities
	{
		category: "READING_ACTIVITIES",
		description: "I can recognise my name",
		sortOrder: 1,
	},
	{
		category: "READING_ACTIVITIES",
		description: "I can match objects or picture",
		sortOrder: 2,
	},
	{
		category: "READING_ACTIVITIES",
		description: "I can spot differences in objects",
		sortOrder: 3,
	},
	{
		category: "READING_ACTIVITIES",
		description: "I can recognise the letters",
		sortOrder: 4,
	},
	{
		category: "READING_ACTIVITIES",
		description: "I know the colours",
		sortOrder: 5,
	},
	{
		category: "READING_ACTIVITIES",
		description: "I can read Lady bird Book I",
		sortOrder: 6,
	},
	{
		category: "READING_ACTIVITIES",
		description: "I can read Lady bird Book II",
		sortOrder: 7,
	},
	// Number Activities
	{
		category: "NUMBER_ACTIVITIES",
		description: "I can count numbers",
		sortOrder: 1,
	},
	{
		category: "NUMBER_ACTIVITIES",
		description: "I can recognise numbers",
		sortOrder: 2,
	},
	{
		category: "NUMBER_ACTIVITIES",
		description: "I can do simple addition",
		sortOrder: 3,
	},
	{
		category: "NUMBER_ACTIVITIES",
		description: "I can do simple subtraction",
		sortOrder: 4,
	},
	// Writing Activities
	{ category: "WRITING_ACTIVITIES", description: "I can write", sortOrder: 1 },
	{
		category: "WRITING_ACTIVITIES",
		description: "I can write my name",
		sortOrder: 2,
	},
	{
		category: "WRITING_ACTIVITIES",
		description: "I can write patterns",
		sortOrder: 3,
	},
	{
		category: "WRITING_ACTIVITIES",
		description: "I can write small letters",
		sortOrder: 4,
	},
	// Social Development
	{
		category: "SOCIAL_DEVELOPMENT",
		description: "I know my first and last name",
		sortOrder: 1,
	},
	{
		category: "SOCIAL_DEVELOPMENT",
		description: "I can say my Daddy's name",
		sortOrder: 2,
	},
	{
		category: "SOCIAL_DEVELOPMENT",
		description: "I can say my Mummy's name",
		sortOrder: 3,
	},
	{
		category: "SOCIAL_DEVELOPMENT",
		description: "I know where I live",
		sortOrder: 4,
	},
	{
		category: "SOCIAL_DEVELOPMENT",
		description: "I know how old I am",
		sortOrder: 5,
	},
	{
		category: "SOCIAL_DEVELOPMENT",
		description: "I know myself as a boy or a girl",
		sortOrder: 6,
	},
	{
		category: "SOCIAL_DEVELOPMENT",
		description: "I like school",
		sortOrder: 7,
	},
	{
		category: "SOCIAL_DEVELOPMENT",
		description: "I make friends in the school",
		sortOrder: 8,
	},
	{ category: "SOCIAL_DEVELOPMENT", description: "I am shy", sortOrder: 9 },
	{
		category: "SOCIAL_DEVELOPMENT",
		description: "I use forms of polite usage (please, thank you)",
		sortOrder: 10,
	},
	// Intellectual Development
	{
		category: "INTELLECTUAL_DEVELOPMENT",
		description: "Express curiosity",
		sortOrder: 1,
	},
	{
		category: "INTELLECTUAL_DEVELOPMENT",
		description: "Uses equipment and material for constructive purpose",
		sortOrder: 2,
	},
	{
		category: "INTELLECTUAL_DEVELOPMENT",
		description: "Listens and responds to music",
		sortOrder: 3,
	},
	{
		category: "INTELLECTUAL_DEVELOPMENT",
		description: "Memorizes and sings songs",
		sortOrder: 4,
	},
	{
		category: "INTELLECTUAL_DEVELOPMENT",
		description: "Shows ability to pay attention",
		sortOrder: 5,
	},
	{
		category: "INTELLECTUAL_DEVELOPMENT",
		description: "I can name objects",
		sortOrder: 6,
	},
	{
		category: "INTELLECTUAL_DEVELOPMENT",
		description: "I can answer simple questions",
		sortOrder: 7,
	},
	{
		category: "INTELLECTUAL_DEVELOPMENT",
		description: "I can ask questions",
		sortOrder: 8,
	},
	{
		category: "INTELLECTUAL_DEVELOPMENT",
		description: "I can describe pictures",
		sortOrder: 9,
	},
	{
		category: "INTELLECTUAL_DEVELOPMENT",
		description: "I can retell a story",
		sortOrder: 10,
	},
];

// BEHAVIORAL TRAITS (Primary)
// From primary report card:
// Social Behaviours and Manipulative Skills
// Rated 1-5: 5=Excellent, 4=Good, 3=Fair, 2=Poor, 1=Very Poor

const BEHAVIORAL_TRAITS = [
	// Social Behaviours
	{ name: "Punctuality", domain: "SOCIAL_BEHAVIOUR" },
	{ name: "Class Attendance", domain: "SOCIAL_BEHAVIOUR" },
	{ name: "Carrying out of Assignment", domain: "SOCIAL_BEHAVIOUR" },
	{ name: "Perseverance", domain: "SOCIAL_BEHAVIOUR" },
	{ name: "Self Control", domain: "SOCIAL_BEHAVIOUR" },
	{ name: "Self Confidence", domain: "SOCIAL_BEHAVIOUR" },
	{ name: "Leadership", domain: "SOCIAL_BEHAVIOUR" },
	{ name: "Obedience", domain: "SOCIAL_BEHAVIOUR" },
	{ name: "Relationship with others", domain: "SOCIAL_BEHAVIOUR" },
	{ name: "Honesty", domain: "SOCIAL_BEHAVIOUR" },
	// Manipulative Skills
	{ name: "Neatness", domain: "MANIPULATIVE_SKILLS" },
	{ name: "Game & Sports", domain: "MANIPULATIVE_SKILLS" },
	{ name: "Manual Skills", domain: "MANIPULATIVE_SKILLS" },
];

// GRADING SYSTEM
// A = Distinction (90 and above)
// C = Credit      (70 to 89)
// P = Pass        (55 to 69)
// F = Fail        (Below 54)

const GRADING_DEFAULTS = {
	passMark: 55, // P - Pass        (55-69)
	creditMark: 70, // C - Credit      (70-89)
	distinctionMark: 90, // A - Distinction (90-100)
	minAverageScore: 55,
	minAttendancePercentage: 75,
	maxFailedSubjects: 3,
};

// SEED FUNCTIONS

const seedCounters = async () => {
	logger.info("Seeding counters...");
	for (const counter of COUNTERS) {
		await prisma.counter.upsert({
			where: { id: counter.id },
			update: {},
			create: { id: counter.id, value: 0 },
		});
		logger.info(`  ✓ ${counter.id}`);
	}
};

const seedAdmins = async () => {
	logger.info("Seeding initial admin accounts...");
	for (const adminData of INITIAL_ADMINS) {
		if (!adminData.email || !adminData.phone) {
			logger.warn("  Skipping admin — missing email or phone in .env");
			continue;
		}

		const existing = await prisma.staff.findUnique({
			where: { email: adminData.email },
		});

		if (existing) {
			logger.info(`  ✓ Admin already exists — skipping: ${adminData.email}`);
			continue;
		}

		let firebaseUser;
		try {
			firebaseUser = await AuthRepository.createFirebaseUser(
				adminData.email,
				adminData.phone,
			);
		} catch (error) {
			if (error.code === "auth/email-already-exists") {
				firebaseUser = await AuthRepository.getFirebaseUserByEmail(
					adminData.email,
				);
				logger.warn(
					`  Firebase user already exists, reusing uid: ${firebaseUser.uid}`,
				);
			} else {
				logger.error(
					`  Firebase failed for ${adminData.email}: ${error.message}`,
				);
				throw error;
			}
		}

		await prisma.$transaction(async (tx) => {
			const staffId = await generateStaffId("ADMIN", tx);
			await tx.staff.create({
				data: {
					staffId,
					firebaseUid: firebaseUser.uid,
					firstName: adminData.firstName,
					lastName: adminData.lastName,
					email: adminData.email,
					phone: adminData.phone,
					gender: adminData.gender ?? null,
					type: "NON_TEACHING",
					role: "ADMIN",
					status: "ACTIVE",
				},
			});
			logger.info(
				`  ✓ Admin created — staffId: ${staffId}, email: ${adminData.email}`,
			);
		});
	}
};

const seedClasses = async () => {
	logger.info("Seeding classes...");
	for (const cls of CLASS_STRUCTURE) {
		const existing = await prisma.class.findFirst({
			where: { name: cls.name },
		});

		if (existing) {
			logger.info(`  ✓ Already exists — skipping: ${cls.name}`);
			continue;
		}

		await prisma.class.create({
			data: {
				name: cls.name,
				color: cls.color ?? null,
				currentEnrollment: 0,
				status: "ACTIVE",
			},
		});
		logger.info(`  ✓ ${cls.name}`);
	}
};

const seedSubjects = async () => {
	logger.info("Seeding primary subjects...");
	for (const sub of PRIMARY_SUBJECTS) {
		const existing = await prisma.subject.findUnique({
			where: { subjectCode: sub.code },
		});
		if (existing) {
			logger.info(`  ✓ Already exists — skipping: ${sub.name}`);
			continue;
		}
		await prisma.subject.create({
			data: {
				subjectName: sub.name,
				subjectCode: sub.code,
				levels: {
					create: PRIMARY_LEVELS.map((level) => ({ level })),
				},
			},
		});
		logger.info(`  ✓ ${sub.name} (${sub.code}) → Primary 1-6`);
	}

	logger.info("Seeding nursery subjects...");
	for (const sub of NURSERY_SUBJECTS) {
		const existing = await prisma.subject.findUnique({
			where: { subjectCode: sub.code },
		});
		if (existing) {
			logger.info(`  ✓ Already exists — skipping: ${sub.name}`);
			continue;
		}
		await prisma.subject.create({
			data: {
				subjectName: sub.name,
				subjectCode: sub.code,
				levels: {
					create: NURSERY_LEVELS.map((level) => ({ level })),
				},
			},
		});
		logger.info(`  ✓ ${sub.name} (${sub.code}) → Nursery levels`);
	}
};

const seedBehavioralTraits = async () => {
	logger.info("Seeding behavioral traits...");
	for (const trait of BEHAVIORAL_TRAITS) {
		await prisma.behavioralTrait.upsert({
			where: { name: trait.name },
			update: {},
			create: { name: trait.name, domain: trait.domain },
		});
		logger.info(`  ✓ ${trait.name} (${trait.domain})`);
	}
};

const seedNurseryAssessmentItems = async () => {
	logger.info("Seeding nursery assessment items...");
	for (const item of NURSERY_ASSESSMENT_ITEMS) {
		const existing = await prisma.nurseryAssessmentItem.findFirst({
			where: {
				category: item.category,
				description: item.description,
			},
		});
		if (existing) {
			logger.info(`  ✓ Already exists — skipping: ${item.description}`);
			continue;
		}
		await prisma.nurseryAssessmentItem.create({ data: item });
		logger.info(`  ✓ [${item.category}] ${item.description}`);
	}
};

const seedSchoolConfiguration = async () => {
	logger.info("Seeding default school configuration...");

	// Seeds a default config for reference — admin should update
	// per term via the config endpoint before each term starts
	const terms = ["FIRST_TERM", "SECOND_TERM", "THIRD_TERM"];
	const academicYear = "2024/2025";

	for (const term of terms) {
		const existing = await prisma.schoolConfiguration.findUnique({
			where: { academicYear_term: { academicYear, term } },
		});
		if (existing) {
			logger.info(`  ✓ Config already exists — skipping: ${term}`);
			continue;
		}
		await prisma.schoolConfiguration.create({
			data: {
				academicYear,
				term,
				maxStudentsPerClass: 30,
				minAverageScore: GRADING_DEFAULTS.minAverageScore,
				minAttendancePercentage: GRADING_DEFAULTS.minAttendancePercentage,
				maxFailedSubjects: GRADING_DEFAULTS.maxFailedSubjects,
				passMark: GRADING_DEFAULTS.passMark,
				creditMark: GRADING_DEFAULTS.creditMark,
				distinctionMark: GRADING_DEFAULTS.distinctionMark,
			},
		});
		logger.info(`  ✓ Config seeded for ${academicYear} — ${term}`);
	}
};

// MAIN

const seed = async () => {
	logger.info("Starting seed...");
	await seedCounters();
	await seedAdmins();
	await seedClasses();
	await seedSubjects();
	await seedBehavioralTraits();
	await seedNurseryAssessmentItems();
	await seedSchoolConfiguration();
	logger.info("Seed complete.");
};

seed()
	.catch((error) => {
		logger.error(`Seed failed: ${error.message}`);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
