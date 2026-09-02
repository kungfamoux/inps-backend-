const StudentRepository = require("../repositories/StudentRepository");
const AuthRepository = require("../../shared/repositories/AuthRepository");
const generateAdmissionNumber = require("../../utils/generateAdmissionNumber");
const logger = require("../../utils/logger");
const { generateSignedUrl } = require("../../utils/uploadToCloudinary");
const { sendParentAccountCreationEmail } = require("../../utils/resend");

const signStudentFiles = (student) => {
	if (!student) return student;

	if (student.passportPhoto) {
		student.passportPhoto = generateSignedUrl(student.passportPhoto, {
			expiresInSeconds: 3600,
			resourceType: "image",
		});
	}

	if (student.admissionDocs) {
		try {
			const publicIds = JSON.parse(student.admissionDocs);
			student.admissionDocs = publicIds.map((id) =>
				generateSignedUrl(id, {
					expiresInSeconds: 3600,
					resourceType: "raw",
				}),
			);
		} catch {
			student.admissionDocs = generateSignedUrl(student.admissionDocs, {
				expiresInSeconds: 3600,
				resourceType: "raw",
			});
		}
	}

	return student;
};

const prisma = require("../../lib/prisma"); // needed for $transaction only

class AdminStudentService {
	async createStudent(data, files) {
		if (!data) throw new Error("Request body is missing"); // enrolle=ment staus should be set to pending from here

		const {
			firstName,
			lastName,
			middleName,
			gender,
			dateOfBirth,
			nationality,
			state,
			lga,
			religion,
			healthInfo,
			bloodGroup,
			sportHouse,
			address,
			intakeType,
			studentType,
			admissionDate,
			accountEmail,
			accountPhone,
			parentData,
			graduationDate,
		} = data;

		if (!firstName || !lastName || !gender || !dateOfBirth || !admissionDate) {
			throw new Error("Fill all required fields");
		}

		if (!accountEmail) throw new Error("Parent account email is required");
		if (!accountPhone) throw new Error("Parent account phone is required");

		const dob = new Date(dateOfBirth);

		// Check for duplicate student
		const existingStudent = await StudentRepository.findDuplicateStudent({
			firstName,
			lastName,
			dateOfBirth: dob,
			accountEmail
		});

		if (existingStudent) {
			throw new Error("A student with these details already exists");
		}
		const admDate = new Date(admissionDate);
		let gradDate = null;

		if (
			graduationDate !== undefined &&
			graduationDate !== null &&
			graduationDate !== ""
		) {
			gradDate = new Date(graduationDate);

			if (isNaN(gradDate.getTime())) {
				throw new Error("Invalid graduationDate");
			}
		}
		if (isNaN(dob.getTime())) throw new Error("Invalid dateOfBirth");
		if (isNaN(admDate.getTime())) throw new Error("Invalid admissionDate");

		// Ensure parentData is a plain object before accessing its properties.
		const safeParentData =
			parentData && typeof parentData === "object" && !Array.isArray(parentData)
				? parentData
				: {};

		logger.info(`Registering student: ${firstName} ${lastName}`);

		const passportPhoto =
			files?.passportPhoto?.[0]?.filename ??
			files?.passportPhotoFile?.filename ??
			null;

		const admissionDocsFiles =
			files?.admissionDocs ?? files?.admissionDocsFile ?? [];
		const admissionDocs = admissionDocsFiles.length
			? JSON.stringify(admissionDocsFiles.map((f) => f.filename))
			: null;

		let parent = await StudentRepository.findParentByAccountEmail(accountEmail);
		let isNewParent = false;

		if (parent) {
			logger.info(
				`Existing parent found — id: ${parent.id}, linking new student`,
			);
		} else {
			isNewParent = true;
			let firebaseUser;
			let firebaseUserCreated = false;
			
			try {
				firebaseUser = await AuthRepository.createFirebaseUser(
					accountEmail,
					accountPhone,
				);
				firebaseUserCreated = true;
				logger.info(
					`Firebase parent account created — uid: ${firebaseUser.uid}`,
				);
			} catch (error) {
				if (error.code === "auth/email-already-exists") {
					logger.warn(
						`Parent Firebase account already exists: ${accountEmail}. Fetching existing user and creating parent record.`,
					);
					// Fetch existing Firebase user by email
					try {
						firebaseUser = await AuthRepository.getUserByEmail(accountEmail);
						logger.info(`Retrieved existing Firebase user — uid: ${firebaseUser.uid}`);
					} catch (fetchError) {
						logger.error(`Failed to fetch existing Firebase user: ${fetchError.message}`);
						throw new Error("A parent account with this email already exists in Firebase, but could not be retrieved");
					}
				} else {
					logger.error(`Firebase parent creation failed: ${error.message}`);
					throw error;
				}
			}

			try {
				// Check if new guardian structure is provided, otherwise fall back to old structure
				let primaryGuardian, secondaryGuardian;
				
				if (safeParentData.primaryGuardian) {
					// New guardian structure
					primaryGuardian = JSON.stringify({
						relationship: safeParentData.primaryGuardian.relationship || "Father",
						title: safeParentData.primaryGuardian.title || "Mr.",
						firstName: safeParentData.primaryGuardian.firstName || "",
						lastName: safeParentData.primaryGuardian.lastName || "",
						phone: safeParentData.primaryGuardian.phone || accountPhone,
						email: safeParentData.primaryGuardian.email || accountEmail,
						occupation: safeParentData.primaryGuardian.occupation || null,
						address: safeParentData.primaryGuardian.address || null,
					});
					secondaryGuardian = safeParentData.secondaryGuardian ? JSON.stringify(safeParentData.secondaryGuardian) : null;
				} else {
					// Backward compatibility: convert old structure to new guardian structure
					primaryGuardian = JSON.stringify({
						relationship: "Father",
						title: "Mr.",
						firstName: safeParentData.fatherFirstName || "",
						lastName: safeParentData.fatherLastName || "",
						phone: safeParentData.fatherPhone || accountPhone,
						email: safeParentData.fatherEmail || accountEmail,
						occupation: safeParentData.fatherOccupation || null,
						address: null,
					});
					secondaryGuardian = (safeParentData.motherFirstName || safeParentData.motherLastName) ? JSON.stringify({
						relationship: "Mother",
						firstName: safeParentData.motherFirstName || "",
						lastName: safeParentData.motherLastName || "",
						phone: safeParentData.motherPhone || "",
						email: safeParentData.motherEmail || "",
						occupation: safeParentData.motherOccupation || null,
					}) : null;
				}
				
				parent = await StudentRepository.createParent({
					firebaseUid: firebaseUser.uid,
					accountEmail,
					accountPhone,
					primaryGuardian,
					secondaryGuardian,
					address: safeParentData.address ?? null,
					maritalStatus: safeParentData.maritalStatus ?? null,
				});
				logger.info(`New parent created — id: ${parent.id}`);
			} catch (error) {
				logger.error(`Parent DB creation failed: ${error.message}`);
				// Only rollback Firebase user if we created it (not if it already existed)
				if (firebaseUserCreated) {
					logger.warn(`Rolling back Firebase user: ${firebaseUser.uid}`);
					await AuthRepository.deleteFirebaseUser(firebaseUser.uid).catch((e) => {
						logger.error(
							`Firebase rollback failed for uid ${firebaseUser.uid}: ${e.message}. Manual cleanup required.`,
						);
					});
				}
				throw error;
			}
		}

		const student = await prisma.$transaction(async (tx) => {
			const admissionNumber = await generateAdmissionNumber(tx);
			logger.info(`Generated admission number: ${admissionNumber}`);

			const created = await StudentRepository.create(
				{
					admissionNumber,
					firstName,
					lastName,
					middleName: middleName ?? null,
					gender,
					dateOfBirth: dob,
					nationality: nationality ?? null,
					state: state ?? null,
					lga: lga ?? null,
					religion: religion ?? null,
					healthInfo: healthInfo ?? null,
					bloodGroup: bloodGroup ?? null,
					sportHouse: sportHouse ?? null,
					address: address ?? null,
					intakeType: intakeType ?? "NEW",
					studentType: studentType ?? null,
					passportPhoto,
					admissionDocs,
					admissionDate: admDate,
					graduationDate: gradDate,
					status: "ACTIVE",
					parentId: parent.id,
				},
				tx,
			);

			logger.info(`Student registered — admissionNumber: ${admissionNumber}`);
			return created;
		});

		// Email delivery failure should never undo a successful registration.
		if (isNewParent) {
			try {
				await sendParentAccountCreationEmail({
					to: parent.accountEmail,
					firstName: student.firstName,
					lastName: student.lastName,
					admissionNumber: student.admissionNumber,
					accountEmail: parent.accountEmail,
					accountPhone: parent.accountPhone,
				});
			} catch (emailError) {
				logger.error(
					`Parent account creation email failed for ${parent.accountEmail}: ${emailError.message}`,
				);
			}
		}

		return signStudentFiles(student);
	}

	async getStudentByAdmissionNumber(admissionNumber) {
		logger.info(`Fetching student: ${admissionNumber}`);
		const student =
			await StudentRepository.findByAdmissionNumber(admissionNumber);
		if (!student) throw new Error(`Student not found: ${admissionNumber}`);
		return signStudentFiles(student);
	}

	async updateStudent(admissionNumber, updateData) {
		logger.info(`Updating student: ${admissionNumber}`);

		const student = await StudentRepository.findByAdmissionNumber(admissionNumber);
		if (!student) throw new Error(`Student not found: ${admissionNumber}`);

		const updated = await StudentRepository.update(student.id, updateData);
		logger.info(`Student updated: ${admissionNumber}`);
		return signStudentFiles(updated);
	}

	async deleteStudent(admissionNumber, staffId) {
		logger.info(`Deleting student and releasing admission number: ${admissionNumber}`);

		const student = await StudentRepository.findByAdmissionNumber(admissionNumber);
		if (!student) throw new Error(`Student not found: ${admissionNumber}`);

		await StudentRepository.hardDeleteAndReleaseAdmissionNumber(admissionNumber, staffId);
		logger.info(`Student deleted and admission number released: ${admissionNumber}`);
		return { message: "Student deleted successfully" };
	}

	async getAllStudents(params) {
		logger.info("Fetching all students");
		const result = await StudentRepository.findAll(params);
		return {
			data: result.data.map(signStudentFiles),
			meta: result.meta
		};
	}
}

module.exports = new AdminStudentService();