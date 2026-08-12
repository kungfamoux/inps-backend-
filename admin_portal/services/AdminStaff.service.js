const axios = require("axios");
const prisma = require("../../lib/prisma");

const AuthRepository = require("../../shared/repositories/AuthRepository");
const StaffRepository = require("../repositories/StaffRepository");
const generateStaffId = require("../../utils/generateStaffId");
const { sanitizeStaff } = require("../../utils/sanitizers");
const logger = require("../../utils/logger");
const {
	sendStaffAccountCreationEmail,
	sendPasswordResetEmail,
} = require("../../utils/resend");

if (!process.env.FIREBASE_API_KEY) {
	throw new Error("FIREBASE_API_KEY is not set in environment variables");
}

const ROLE_CAPS = {
	ADMIN: 2,
	HEAD_TEACHER: 1,
};

const deriveType = (role) => (role === "TEACHER" ? "TEACHING" : "NON_TEACHING");

class AdminStaffService {
	async createStaffAccount(staffData) {
		const {
			firstName,
			lastName,
			email,
			phone,
			role,
			gender,
			dateOfBirth,
			address,
		} = staffData;

		if (!firstName || !lastName || !email || !phone || !role) {
			throw new Error("Fill all required fields");
		}

		if (ROLE_CAPS[role] !== undefined) {
			const currentCount = await StaffRepository.count({ role });
			if (currentCount >= ROLE_CAPS[role]) {
				const capMessage =
					role === "ADMIN"
						? "Maximum of 2 admin accounts allowed"
						: "Only 1 head teacher account is allowed";
				logger.warn(
					`Role cap reached for ${role}: ${currentCount}/${ROLE_CAPS[role]}`,
				);
				throw new Error(capMessage);
			}
		}

		logger.info(`Creating staff account for ${email} with role ${role}`);

		let firebaseUser;
		let isLinkedExistingAccount = false;
		try {
			firebaseUser = await AuthRepository.createFirebaseUser(email, phone);
			logger.info(
				`Firebase user created for ${email} — uid: ${firebaseUser.uid}`,
			);
		} catch (error) {
			if (error.code !== "auth/email-already-exists") {
				logger.error(`Firebase creation failed for ${email}: ${error.message}`);
				throw error;
			}

			// This email is already registered in Firebase — but Firebase auth is
			// shared across staff and parent portals, so this may just be someone
			// who is already a parent. Only block if a Staff row already uses
			// this Firebase account; otherwise link the new staff role to it.
			const existingUser = await AuthRepository.getFirebaseUserByEmail(email);
			const existingStaff = await StaffRepository.findByFirebaseUid(
				existingUser.uid,
			);

			if (existingStaff) {
				logger.warn(`Staff creation failed — email already exists: ${email}`);
				throw new Error("A staff account with this email already exists");
			}

			logger.info(
				`Linking staff role to existing Firebase account for ${email} — uid: ${existingUser.uid}`,
			);
			await AuthRepository.resetPasswordToPhone(existingUser.uid, phone);
			firebaseUser = existingUser;
			isLinkedExistingAccount = true;
		}

		try {
			const staff = await prisma.$transaction(async (tx) => {
				const staffId = await generateStaffId(role, tx);
				logger.info(`Generated staffId: ${staffId}`);
				return StaffRepository.create(
					{
						staffId,
						firebaseUid: firebaseUser.uid,
						firstName,
						lastName,
						email,
						phone,
						gender: gender ?? null,
						dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
						address: address ?? null,
						type: deriveType(role),
						role,
						status: "ACTIVE",
					},
					tx,
				);
			});
			logger.info(`Staff account created — staffId: ${staff.staffId}`);

			// Email delivery failure should never undo a successful account creation.
			try {
				await sendStaffAccountCreationEmail({
					to: staff.email,
					staffName: `${staff.firstName} ${staff.lastName}`,
					staffEmail: staff.email,
					phoneNumber: staff.phone,
				});
			} catch (emailError) {
				logger.error(
					`Staff account creation email failed for ${staff.email}: ${emailError.message}`,
				);
			}

			return sanitizeStaff(staff);
		} catch (error) {
			logger.error(
				`Prisma staff creation failed for ${email}: ${error.message}`,
			);

			// Only delete the Firebase account if we created it fresh — never
			// delete one we linked to, since it may still be a valid parent account.
			if (isLinkedExistingAccount) {
				logger.warn(
					`Skipping Firebase rollback — uid ${firebaseUser.uid} belongs to a pre-existing (e.g. parent) account`,
				);
			} else {
				logger.warn(`Rolling back Firebase user uid: ${firebaseUser.uid}`);
				await AuthRepository.deleteFirebaseUser(firebaseUser.uid).catch((e) => {
					logger.error(
						`Firebase rollback failed for uid ${firebaseUser.uid}: ${e.message}. Manual cleanup required.`,
					);
				});
			}
			throw error;
		}
	}

	async getAllStaff(filters = {}) {
		logger.info(`Fetching all staff — filters: ${JSON.stringify(filters)}`);

		const results = await StaffRepository.findAll(filters);

		return {
			...results,
			data: results.data.map(sanitizeStaff),
		};
	}

	async getActiveStaff(filters = {}) {
		logger.info(`Fetching active staff — filters: ${JSON.stringify(filters)}`);

		const results = await StaffRepository.findAllActive(filters);

		return {
			...results,
			data: results.data.map(sanitizeStaff),
		};
	}
	async getStaffById(staffId) {
		logger.info(`Fetching staff: ${staffId}`);
		const staff = await StaffRepository.findById(staffId);
		if (!staff) throw new Error("Staff member not found");
		return sanitizeStaff(staff);
	}

	// Single update endpoint — handles both profile fields and role changes.
	// If role is included, role cap checks run.
	// staffId, firebaseUid, email, and status are always protected.
	async updateStaff(staffId, updateData) {
		logger.info(`Updating staff: ${staffId}`);

		const staff = await StaffRepository.findById(staffId);
		if (!staff) throw new Error("Staff member not found");

		// These can never be changed
		const immutable = ["staffId", "firebaseUid", "email", "status"];
		for (const field of immutable) {
			delete updateData[field];
		}

		//  Role update logic
		const isRoleUpdate = updateData.role !== undefined;

		if (isRoleUpdate) {
			const newRole = updateData.role;

			// Role cap check (only if role is actually changing)
			if (ROLE_CAPS[newRole] !== undefined && newRole !== staff.role) {
				const currentCount = await StaffRepository.count({ role: newRole });
				if (currentCount >= ROLE_CAPS[newRole]) {
					const capMessage =
						newRole === "ADMIN"
							? "Maximum of 2 admin accounts allowed"
							: "Only 1 head teacher account is allowed";
					logger.warn(
						`Role cap reached for ${newRole}: ${currentCount}/${ROLE_CAPS[newRole]}`,
					);
					throw new Error(capMessage);
				}
			}

			// Keep type in sync with the new primary role
			updateData.type = deriveType(newRole);

			logger.info(`Role change detected — ${newRole}`);
		}

		//  Profile fields
		if (updateData.dateOfBirth) {
			updateData.dateOfBirth = new Date(updateData.dateOfBirth);
		}

		const updated = await StaffRepository.update(staff.id, updateData);
		logger.info(`Staff updated: ${staffId}`);
		return sanitizeStaff(updated);
	}

	async resetPasswordToDefault(staffId, performedByName) {
		logger.info(`Resetting password to default for staffId: ${staffId}`);

		const staff = await StaffRepository.findById(staffId);
		if (!staff) throw new Error("Staff member not found");
		if (!staff.phone) throw new Error("No phone number on record to reset to");

		await AuthRepository.resetPasswordToPhone(staff.firebaseUid, staff.phone);
		logger.info(`Password reset to default for staffId: ${staffId}`);

		try {
			await sendPasswordResetEmail({
				to: staff.email,
				staffName: `${staff.firstName} ${staff.lastName}`,
				staffEmail: staff.email,
				phoneNumber: staff.phone,
				resetDate: new Date().toLocaleString(),
				adminName: performedByName || "the school administrator",
			});
		} catch (emailError) {
			logger.error(
				`Password reset email failed for ${staff.email}: ${emailError.message}`,
			);
		}
	}

	async deactivateStaffAccount(staffId) {
		logger.info(`Deactivating staff account: ${staffId}`);

		const staff = await StaffRepository.findById(staffId);
		if (!staff) throw new Error("Staff member not found");
		if (staff.deletedAt)
			throw new Error("Staff account is already deactivated");

		if (staff.role === "ADMIN") {
			const activeAdminCount = await StaffRepository.count({ role: "ADMIN" });
			if (activeAdminCount <= 1) {
				logger.warn(
					`Deactivation blocked for admin ${staff.email} — minimum 1 active admin required`,
				);
				throw new Error(
					"Cannot deactivate — at least 1 active admin account must remain",
				);
			}
		}

		await AuthRepository.disableFirebaseUser(staff.firebaseUid);

		const updated = await StaffRepository.update(staff.id, {
			deletedAt: new Date(),
			status: "INACTIVE",
		});

		logger.info(`Staff account deactivated: ${staffId}`);
		return sanitizeStaff(updated);
	}

	async reactivateStaffAccount(staffId) {
		logger.info(`Reactivating staff account: ${staffId}`);

		const staff = await StaffRepository.findById(staffId);
		if (!staff) throw new Error("Staff member not found");
		if (!staff.deletedAt) throw new Error("Staff account is already active");

		await AuthRepository.enableFirebaseUser(staff.firebaseUid);

		const updated = await StaffRepository.update(staff.id, {
			deletedAt: null,
			status: "ACTIVE",
		});

		logger.info(`Staff account reactivated: ${staffId}`);
		return sanitizeStaff(updated);
	}
}

module.exports = new AdminStaffService();
