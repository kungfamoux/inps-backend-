const daysOverdue = (dueDate) => {
	const now = new Date();
	const due = new Date(dueDate);
	const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
	return diff > 0 ? diff : 0;
};

const sanitizeStudent = (student) => {
	if (!student) return null;
	const { biometricId, admissionDocs, deletedAt, ...safe } = student;
	return safe;
};

const sanitizeParent = (parent) => {
	if (!parent) return null;
	const { firebaseUid, biometricId, updatedAt, createdAt, deletedAt, ...safe } =
		parent;
	
	// Parse JSON fields if they exist
	let parsedSafe = { ...safe };
	if (safe.primaryGuardian && typeof safe.primaryGuardian === 'string') {
		try {
			parsedSafe.primaryGuardian = JSON.parse(safe.primaryGuardian);
		} catch (e) {
			// Keep original if parsing fails
		}
	}
	if (safe.secondaryGuardian && typeof safe.secondaryGuardian === 'string') {
		try {
			parsedSafe.secondaryGuardian = JSON.parse(safe.secondaryGuardian);
		} catch (e) {
			// Keep original if parsing fails
		}
	}
	
	return parsedSafe;
};

const sanitizeStaff = (staff) => {
	if (!staff) return null;
	const { firebaseUid, biometricId, createdAt, updatedAt, deletedAt, ...safe } =
		staff;
	
	// Parse JSON fields if they exist
	let parsedSafe = { ...safe };
	if (safe.qualifications && typeof safe.qualifications === 'string') {
		try {
			parsedSafe.qualifications = JSON.parse(safe.qualifications);
		} catch (e) {
			// Keep original if parsing fails
		}
	}
	if (safe.previousEmployment && typeof safe.previousEmployment === 'string') {
		try {
			parsedSafe.previousEmployment = JSON.parse(safe.previousEmployment);
		} catch (e) {
			// Keep original if parsing fails
		}
	}
	
	return parsedSafe;
};

const sanitizeStaffFinancial = (financial) => {
	if (!financial) return null;
	const { staffId, createdAt, updatedAt, ...safe } = financial;
	return safe;
};

const sanitizeResult = (result) => {
	if (!result) return null;
	const { staffId, isVerified, verifiedById, verifiedAt, ...safe } = result;
	return safe;
};

const sanitizeEnrollment = (e) => {
	if (!e) return null;
	return {
		id: e.id,
		studentId: e.studentId,
		classId: e.classId,
		academicYear: e.academicYear,
		term: e.term,
		status: e.status,
		transferredAt: e.transferredAt,
		previousClassId: e.previousClassId,
		transferCount: e.transferCount,
	};
};
const sanitizeSession = (s) => ({
	id: s.id,
	session: s.session,
	createdAt: s.createdAt,
	terms: s.terms?.map(sanitizeTerm) ?? undefined,
});

const sanitizeTerm = (t) => ({
	id: t.id,
	term: t.term,
	status: t.status,
	startDate: t.startDate,
	endDate: t.endDate,
	sessionId: t.sessionId,
	session: t.session ? {
		id: t.session.id,
		session: t.session.session,
		status: t.session.status,
		createdAt: t.session.createdAt,
	} : undefined,
});

const sanitizeCalendar = (c) => ({
	id: c.id,
	academicYear: c.academicYear,
	term: c.term,
	startDate: c.startDate,
	endDate: c.endDate,
	holidays: c.holidays ?? undefined,
});

const sanitizeConfig = (c) => ({
	id: c.id,
	academicYear: c.academicYear,
	term: c.term,
	maxStudentsPerClass: c.maxStudentsPerClass,
	minAverageScore: c.minAverageScore,
	minAttendancePercentage: c.minAttendancePercentage,
	maxFailedSubjects: c.maxFailedSubjects,

	passMark: c.passMark,
	creditMark: c.creditMark,
	distinctionMark: c.distinctionMark,
});
const sanitizeInvoice = (inv) => ({
	id: inv.id,
	invoiceNumber: inv.invoiceNumber,
	billName: inv.bill?.name ?? null,
	amount: inv.amount,
	amountPaid: inv.amountPaid,
	balance: inv.balance,
	status: inv.status,
	dueDate: inv.dueDate,
	academicYear: inv.academicYear,
	term: inv.term,
});

function sanitizeString(value) {
	if (value === null || value === undefined) return null;
	if (typeof value !== "string") return value;

	const trimmed = value.trim();
	if (trimmed === "") return null;

	// Strip characters that have no place in normal input:
	// < > prevent XSS; $ { } prevent NoSQL injection patterns
	return trimmed.replace(/[<>${}]/g, "");
}

/**
 * Recursively sanitizes all string values in an object.
 * Non-string primitives (numbers, booleans) are passed through unchanged.
 * Arrays are sanitized element by element.
 */
function sanitizeObject(obj) {
	if (obj === null || obj === undefined) return obj;

	if (Array.isArray(obj)) {
		return obj.map(sanitizeObject);
	}

	if (typeof obj === "object") {
		return Object.fromEntries(
			Object.entries(obj).map(([key, value]) => [key, sanitizeObject(value)]),
		);
	}

	if (typeof obj === "string") {
		return sanitizeString(obj);
	}

	return obj;
}

/**
 * Sanitizes req.body. Returns a clean object safe for use in services.
 */
function sanitizeBody(body) {
	return sanitizeObject(body ?? {});
}

/**
 * Sanitizes req.query. Returns a clean object safe for use in services.
 */
function sanitizeQueryParams(query) {
	return sanitizeObject(query ?? {});
}

/**
 * Sanitizes a single route param (string).
 */
function sanitizeParam(value) {
	return sanitizeString(value);
}
const cleanOptionalString = (value) => {
	if (typeof value !== "string") return undefined;

	const trimmed = value.trim();
	return trimmed || undefined;
};

const compactObject = (value) =>
	Object.fromEntries(
		Object.entries(value).filter(([, entry]) => entry !== undefined),
	);

const sanitizeResultResponse = (result, options = {}) => {
	if (!result) return null;

	const remarks = compactObject({
		subjectTeacherRemark: cleanOptionalString(result.subjectTeacherRemark),
	});

	return compactObject({
		id: result.id,
		studentId: result.studentId,
		subjectId: result.subjectId,
		staffId: result.staffId,
		termId: result.termId,
		sessionId: result.sessionId,
		scores: {
			ca1: result.ca1Score,
			ca2: result.ca2Score,
			exam: result.examScore,
			total: result.total,
			grade: result.grade,
		},
		ranking: compactObject({
			status: options.rankingsPending ? "PENDING_RECALCULATION" : "READY",
			position: result.position ?? undefined,
			overallPosition: result.overallPosition ?? undefined,
			classAverage: result.classAverage ?? undefined,
		}),
		remarks: Object.keys(remarks).length ? remarks : undefined,
		student: result.student
			? {
					admissionNumber: result.student.admissionNumber,
					firstName: result.student.firstName,
					lastName: result.student.lastName,
				}
			: undefined,
		subject: result.subject
			? {
					subjectName: result.subject.subjectName,
					subjectCode: result.subject.subjectCode,
				}
			: undefined,
		isVerified: result.isVerified,
		verifiedAt: result.verifiedAt,
		createdAt: result.createdAt,
		updatedAt: result.updatedAt,
	});
};

const sanitizePayment = (p) => ({
	paymentId: p.id,
	studentName: `${p.student.firstName} ${p.student.lastName}`,
	admissionNumber: p.student.admissionNumber,
	class: p.student.enrollments?.[0]?.class?.name ?? null,
	feeType: p.invoice?.bill?.name ?? null,
	amount: p.amount,
	paymentMethod: p.paymentMethod,
	paymentDate: p.paymentDate,
	academicYear: p.invoice?.academicYear ?? null,
	term: p.invoice?.term ?? null,
	invoiceNumber: p.invoice?.invoiceNumber ?? null,
});

// Invoice row shaped for bursary-facing listings (fee collections, and the
// former dedicated debtors endpoint now folded into it as a status filter) —
// includes student identity and parent contact fields so bursary staff can
// see who owes what and reach the family, in one response.
const sanitizeInvoiceRecord = (inv) => {
	const parent = inv.parent;
	
	// Parse primary guardian JSON if available
	let primaryGuardian = null;
	if (parent?.primaryGuardian) {
		try {
			primaryGuardian = typeof parent.primaryGuardian === 'string' 
				? JSON.parse(parent.primaryGuardian) 
				: parent.primaryGuardian;
		} catch (e) {
			primaryGuardian = null;
		}
	}
	
	// Parse secondary guardian JSON if available
	let secondaryGuardian = null;
	if (parent?.secondaryGuardian) {
		try {
			secondaryGuardian = typeof parent.secondaryGuardian === 'string' 
				? JSON.parse(parent.secondaryGuardian) 
				: parent.secondaryGuardian;
		} catch (e) {
			secondaryGuardian = null;
		}
	}
	
	const primaryName = [primaryGuardian?.firstName, primaryGuardian?.lastName]
		.filter(Boolean)
		.join(" ");
	const secondaryName = [secondaryGuardian?.firstName, secondaryGuardian?.lastName]
		.filter(Boolean)
		.join(" ");
	const parentName = primaryName || secondaryName || "N/A";
	const parentPhone = primaryGuardian?.phone || secondaryGuardian?.phone || parent?.accountPhone || "N/A";

	return {
		invoiceId: inv.id,
		invoiceNumber: inv.invoiceNumber,
		studentName: `${inv.student.firstName} ${inv.student.lastName}`,
		admissionNumber: inv.student.admissionNumber,
		class: inv.student.enrollments?.[0]?.class?.name ?? null,
		feeType: inv.bill?.name ?? null,
		amount: inv.amount,
		amountPaid: inv.amountPaid,
		balance: inv.balance,
		status: inv.status,
		dueDate: inv.dueDate,
		daysOverdue: daysOverdue(inv.dueDate),
		parentName,
		parentPhone,
		parentEmail: parent?.accountEmail ?? null,
		academicYear: inv.academicYear,
		term: inv.term,
	};
};

const sanitizeClass = (c) => ({
	id: c.id,
	name: c.name,
	color: c.color,
	roomNumber: c.roomNumber,
	status: c.status,
	currentEnrollment: c.currentEnrollment,
	_count: c._count,
	classTeacher: c.classTeacher
		? {
				staffId: c.classTeacher.staffId,
				firstName: c.classTeacher.firstName,
				lastName: c.classTeacher.lastName,
			}
		: null,
	assistantTeacher: c.assistantTeacher
		? {
				staffId: c.assistantTeacher.staffId,
				firstName: c.assistantTeacher.firstName,
				lastName: c.assistantTeacher.lastName,
			}
		: null,
});

module.exports = {
	sanitizeString,
	cleanOptionalString,
	sanitizeObject,
	sanitizeBody,
	sanitizeQueryParams,
	sanitizeParam,
	sanitizeStudent,
	sanitizeParent,
	sanitizeStaff,
	sanitizeStaffFinancial,
	sanitizeResult,
	sanitizeEnrollment,
	sanitizeSession,
	sanitizeTerm,
	sanitizeCalendar,
	sanitizeConfig,
	sanitizeInvoice,
	sanitizePayment,
	sanitizeResultResponse,
	sanitizeInvoiceRecord,
	sanitizeClass,
	daysOverdue,
};
