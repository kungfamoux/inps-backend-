const AuthRepository = require("../repositories/AuthRepository");
const StaffRepository = require("../../admin_portal/repositories/StaffRepository");
const ParentRepository = require("../../admin_portal/repositories/ParentRepository");
const StudentRepository = require("../../admin_portal/repositories/StudentRepository");
const logger = require("../../utils/logger");

class UserManagementService {
	// ==================== SHARED ACCOUNT HELPERS ====================

	/**
	 * Check if a Firebase account is shared between staff and parent
	 * @param {string} firebaseUid - Firebase user UID
	 * @returns {Promise<boolean>} - True if shared, false otherwise
	 */
	async isFirebaseAccountShared(firebaseUid) {
		try {
			const [staff, parent] = await Promise.all([
				StaffRepository.findByFirebaseUid(firebaseUid),
				ParentRepository.findByFirebaseUid(firebaseUid),
			]);

			return !!(staff && parent);
		} catch (error) {
			logger.error(`Error checking shared account for ${firebaseUid}: ${error.message}`);
			return false;
		}
	}

	/**
	 * Get all owners of a Firebase account
	 * @param {string} firebaseUid - Firebase user UID
	 * @returns {Promise<{staff: object|null, parent: object|null}>}
	 */
	async getFirebaseAccountOwners(firebaseUid) {
		try {
			const [staff, parent] = await Promise.all([
				StaffRepository.findByFirebaseUid(firebaseUid),
				ParentRepository.findByFirebaseUid(firebaseUid),
			]);

			return { staff, parent };
		} catch (error) {
			logger.error(`Error getting account owners for ${firebaseUid}: ${error.message}`);
			return { staff: null, parent: null };
		}
	}

	// ==================== STAFF OPERATIONS ====================

	/**
	 * Create staff with Firebase sync
	 * @param {object} staffData - Staff data including email, phone, role, etc.
	 * @param {object} options - Options like skipFirebaseCreation
	 * @returns {Promise<object>} - Created staff record
	 */
	async createStaff(staffData, options = {}) {
		const { email, phone, role } = staffData;
		const { skipFirebaseCreation = false } = options;

		logger.info(`[UserManagement] Creating staff account for ${email}`);

		let firebaseUser;
		let isLinkedExistingAccount = false;

		// Step 1: Create or link Firebase user
		if (!skipFirebaseCreation) {
			try {
				firebaseUser = await AuthRepository.createFirebaseUser(email, phone);
				logger.info(`[UserManagement] Firebase user created for ${email} — uid: ${firebaseUser.uid}`);
			} catch (error) {
				if (error.code === "auth/email-already-exists") {
					// Email already exists in Firebase - check if it's a staff account
					const existingUser = await AuthRepository.getFirebaseUserByEmail(email);
					const existingStaff = await StaffRepository.findByFirebaseUid(existingUser.uid);

					if (existingStaff) {
						logger.warn(`[UserManagement] Staff creation failed — email already exists: ${email}`);
						throw new Error("A staff account with this email already exists");
					}

					// Link to existing Firebase account (might be a parent account)
					logger.info(`[UserManagement] Linking staff to existing Firebase account for ${email}`);
					await AuthRepository.resetPasswordToPhone(existingUser.uid, phone);
					firebaseUser = existingUser;
					isLinkedExistingAccount = true;
				} else {
					logger.error(`[UserManagement] Firebase creation failed for ${email}: ${error.message}`);
					throw new Error(`Firebase user creation failed: ${error.message}`);
				}
			}
		} else {
			// Skip Firebase creation - assume firebaseUid is provided in staffData
			if (!staffData.firebaseUid) {
				throw new Error("firebaseUid must be provided when skipFirebaseCreation is true");
			}
			firebaseUser = { uid: staffData.firebaseUid };
		}

		// Step 2: Create staff in database
		try {
			const staff = await StaffRepository.create({
				...staffData,
				firebaseUid: firebaseUser.uid,
			});

			logger.info(`[UserManagement] Staff account created — staffId: ${staff.staffId}`);
			return staff;
		} catch (error) {
			logger.error(`[UserManagement] Staff DB creation failed for ${email}: ${error.message}`);

			// Rollback: Delete Firebase user if we created it fresh
			if (!isLinkedExistingAccount && !skipFirebaseCreation) {
				logger.warn(`[UserManagement] Rolling back Firebase user uid: ${firebaseUser.uid}`);
				try {
					await AuthRepository.deleteFirebaseUser(firebaseUser.uid);
					logger.info(`[UserManagement] Firebase rollback successful for uid: ${firebaseUser.uid}`);
				} catch (rollbackError) {
					logger.error(
						`[UserManagement] Firebase rollback failed for uid ${firebaseUser.uid}: ${rollbackError.message}. Manual cleanup required.`,
					);
					throw new Error(
						`Staff creation failed and Firebase rollback failed. Manual cleanup needed for Firebase UID: ${firebaseUser.uid}`,
					);
				}
			}

			throw error;
		}
	}

	/**
	 * Delete staff with Firebase sync
	 * @param {string} staffId - Staff ID
	 * @returns {Promise<object>} - Deleted staff record
	 */
	async deleteStaff(staffId) {
		logger.info(`[UserManagement] Deleting staff: ${staffId}`);

		const staff = await StaffRepository.findById(staffId);
		if (!staff) throw new Error("Staff member not found");

		if (!staff.firebaseUid) {
			logger.warn(`[UserManagement] Staff ${staffId} has no firebaseUid, skipping Firebase deletion`);
			await StaffRepository.softDelete(staff.id);
			return staff;
		}

		// Check if Firebase account is shared
		const isShared = await this.isFirebaseAccountShared(staff.firebaseUid);
		if (isShared) {
			logger.warn(`[UserManagement] Firebase account ${staff.firebaseUid} is shared, cannot delete`);
			throw new Error(
				"Cannot delete staff - Firebase account is shared with a parent account. Please unlink or delete the parent account first.",
			);
		}

		// Step 1: Delete Firebase user
		try {
			await AuthRepository.deleteFirebaseUser(staff.firebaseUid);
			logger.info(`[UserManagement] Firebase user deleted for staff: ${staffId}`);
		} catch (error) {
			// If Firebase user doesn't exist, log warning but continue with DB deletion
			if (error.message && error.message.includes("no user record")) {
				logger.warn(`[UserManagement] Firebase user does not exist for ${staff.firebaseUid}, skipping Firebase deletion`);
			} else {
				logger.error(`[UserManagement] Firebase deletion failed for staff ${staffId}: ${error.message}`);
				throw new Error(`Firebase user deletion failed: ${error.message}`);
			}
		}

		// Step 2: Delete staff from database
		try {
			const deleted = await StaffRepository.softDelete(staff.id);
			logger.info(`[UserManagement] Staff deleted: ${staffId}`);
			return deleted;
		} catch (error) {
			logger.error(`[UserManagement] Staff DB deletion failed for ${staffId}: ${error.message}`);

			// Rollback: Recreate Firebase user (only if we successfully deleted it)
			logger.warn(`[UserManagement] Rolling back Firebase recreation for uid: ${staff.firebaseUid}`);
			try {
				await AuthRepository.createFirebaseUser(staff.email, staff.phone);
				logger.info(`[UserManagement] Firebase rollback successful for uid: ${staff.firebaseUid}`);
			} catch (rollbackError) {
				logger.error(
					`[UserManagement] Firebase rollback failed for uid ${staff.firebaseUid}: ${rollbackError.message}. Manual cleanup required.`,
				);
				throw new Error(
					`Staff deletion failed and Firebase rollback failed. Manual cleanup needed for email: ${staff.email}`,
				);
			}

			throw error;
		}
	}

	/**
	 * Deactivate staff with Firebase sync
	 * @param {string} staffId - Staff ID
	 * @param {object} options - Options like skipAdminCheck
	 * @returns {Promise<object>} - Deactivated staff record
	 */
	async deactivateStaff(staffId, options = {}) {
		const { skipAdminCheck = false } = options;

		logger.info(`[UserManagement] Deactivating staff: ${staffId}`);

		const staff = await StaffRepository.findById(staffId);
		if (!staff) throw new Error("Staff member not found");
		if (staff.deletedAt) throw new Error("Staff account is already deactivated");

		// Admin count check (can be skipped if already validated in calling service)
		if (!skipAdminCheck && staff.role === "ADMIN") {
			const activeAdminCount = await StaffRepository.count({ role: "ADMIN" });
			if (activeAdminCount <= 1) {
				logger.warn(
					`[UserManagement] Deactivation blocked for admin ${staff.email} — minimum 1 active admin required`,
				);
				throw new Error("Cannot deactivate — at least 1 active admin account must remain");
			}
		}

		if (!staff.firebaseUid) {
			logger.warn(`[UserManagement] Staff ${staffId} has no firebaseUid, skipping Firebase disable`);
			const updated = await StaffRepository.update(staff.id, {
				deletedAt: new Date(),
				status: "INACTIVE",
			});
			return updated;
		}

		// Step 1: Disable Firebase user
		try {
			await AuthRepository.disableFirebaseUser(staff.firebaseUid);
			logger.info(`[UserManagement] Firebase user disabled for staff: ${staffId}`);
		} catch (error) {
			logger.error(`[UserManagement] Firebase disable failed for staff ${staffId}: ${error.message}`);
			throw new Error(`Firebase user disable failed: ${error.message}`);
		}

		// Step 2: Update database
		try {
			const updated = await StaffRepository.update(staff.id, {
				deletedAt: new Date(),
				status: "INACTIVE",
			});
			logger.info(`[UserManagement] Staff deactivated: ${staffId}`);
			return updated;
		} catch (error) {
			logger.error(`[UserManagement] Staff DB update failed for ${staffId}: ${error.message}`);

			// Rollback: Re-enable Firebase user
			logger.warn(`[UserManagement] Rolling back Firebase enable for uid: ${staff.firebaseUid}`);
			try {
				await AuthRepository.enableFirebaseUser(staff.firebaseUid);
				logger.info(`[UserManagement] Firebase rollback successful for uid: ${staff.firebaseUid}`);
			} catch (rollbackError) {
				logger.error(
					`[UserManagement] Firebase rollback failed for uid ${staff.firebaseUid}: ${rollbackError.message}. Manual cleanup required.`,
				);
				throw new Error(
					`Staff deactivation failed and Firebase rollback failed. Manual cleanup needed for Firebase UID: ${staff.firebaseUid}`,
				);
			}

			throw error;
		}
	}

	/**
	 * Reactivate staff with Firebase sync
	 * @param {string} staffId - Staff ID
	 * @returns {Promise<object>} - Reactivated staff record
	 */
	async reactivateStaff(staffId) {
		logger.info(`[UserManagement] Reactivating staff: ${staffId}`);

		const staff = await StaffRepository.findById(staffId);
		if (!staff) throw new Error("Staff member not found");
		if (!staff.deletedAt) throw new Error("Staff account is already active");

		if (!staff.firebaseUid) {
			logger.warn(`[UserManagement] Staff ${staffId} has no firebaseUid, skipping Firebase enable`);
			const updated = await StaffRepository.update(staff.id, {
				deletedAt: null,
				status: "ACTIVE",
			});
			return updated;
		}

		// Step 1: Enable Firebase user
		try {
			await AuthRepository.enableFirebaseUser(staff.firebaseUid);
			logger.info(`[UserManagement] Firebase user enabled for staff: ${staffId}`);
		} catch (error) {
			logger.error(`[UserManagement] Firebase enable failed for staff ${staffId}: ${error.message}`);
			throw new Error(`Firebase user enable failed: ${error.message}`);
		}

		// Step 2: Update database
		try {
			const updated = await StaffRepository.update(staff.id, {
				deletedAt: null,
				status: "ACTIVE",
			});
			logger.info(`[UserManagement] Staff reactivated: ${staffId}`);
			return updated;
		} catch (error) {
			logger.error(`[UserManagement] Staff DB update failed for ${staffId}: ${error.message}`);

			// Rollback: Disable Firebase user
			logger.warn(`[UserManagement] Rolling back Firebase disable for uid: ${staff.firebaseUid}`);
			try {
				await AuthRepository.disableFirebaseUser(staff.firebaseUid);
				logger.info(`[UserManagement] Firebase rollback successful for uid: ${staff.firebaseUid}`);
			} catch (rollbackError) {
				logger.error(
					`[UserManagement] Firebase rollback failed for uid ${staff.firebaseUid}: ${rollbackError.message}. Manual cleanup required.`,
				);
				throw new Error(
					`Staff reactivation failed and Firebase rollback failed. Manual cleanup needed for Firebase UID: ${staff.firebaseUid}`,
				);
			}

			throw error;
		}
	}

	/**
	 * Update staff email with Firebase sync
	 * @param {string} staffId - Staff ID
	 * @param {string} newEmail - New email address
	 * @returns {Promise<object>} - Updated staff record
	 */
	async updateStaffEmail(staffId, newEmail) {
		logger.info(`[UserManagement] Updating staff email: ${staffId}`);

		const staff = await StaffRepository.findById(staffId);
		if (!staff) throw new Error("Staff member not found");

		if (!staff.firebaseUid) {
			logger.warn(`[UserManagement] Staff ${staffId} has no firebaseUid, skipping Firebase email update`);
			const updated = await StaffRepository.update(staff.id, { email: newEmail });
			return updated;
		}

		const oldEmail = staff.email;

		// Step 1: Update Firebase email
		try {
			await AuthRepository.updateEmail(staff.firebaseUid, newEmail);
			logger.info(`[UserManagement] Firebase email updated for staff: ${staffId}`);
		} catch (error) {
			logger.error(`[UserManagement] Firebase email update failed for staff ${staffId}: ${error.message}`);
			throw new Error(`Firebase email update failed: ${error.message}`);
		}

		// Step 2: Update database
		try {
			const updated = await StaffRepository.update(staff.id, { email: newEmail });
			logger.info(`[UserManagement] Staff email updated: ${staffId}`);
			return updated;
		} catch (error) {
			logger.error(`[UserManagement] Staff DB update failed for ${staffId}: ${error.message}`);

			// Rollback: Revert Firebase email
			logger.warn(`[UserManagement] Rolling back Firebase email for uid: ${staff.firebaseUid}`);
			try {
				await AuthRepository.updateEmail(staff.firebaseUid, oldEmail);
				logger.info(`[UserManagement] Firebase rollback successful for uid: ${staff.firebaseUid}`);
			} catch (rollbackError) {
				logger.error(
					`[UserManagement] Firebase rollback failed for uid ${staff.firebaseUid}: ${rollbackError.message}. Manual cleanup required.`,
				);
				throw new Error(
					`Staff email update failed and Firebase rollback failed. Manual cleanup needed for Firebase UID: ${staff.firebaseUid}`,
				);
			}

			throw error;
		}
	}

	// ==================== PARENT OPERATIONS ====================

	/**
	 * Create parent with Firebase sync
	 * @param {object} parentData - Parent data including accountEmail, accountPhone, etc.
	 * @param {object} options - Options like skipFirebaseCreation
	 * @returns {Promise<object>} - Created parent record
	 */
	async createParent(parentData, options = {}) {
		const { accountEmail, accountPhone } = parentData;
		const { skipFirebaseCreation = false } = options;

		logger.info(`[UserManagement] Creating parent account for ${accountEmail}`);

		let firebaseUser;
		let isLinkedExistingAccount = false;

		// Step 1: Create or link Firebase user
		if (!skipFirebaseCreation) {
			try {
				firebaseUser = await AuthRepository.createFirebaseUser(accountEmail, accountPhone);
				logger.info(`[UserManagement] Firebase user created for parent ${accountEmail} — uid: ${firebaseUser.uid}`);
			} catch (error) {
				if (error.code === "auth/email-already-exists") {
					// Email already exists in Firebase - check if it's a parent account
					const existingUser = await AuthRepository.getFirebaseUserByEmail(accountEmail);
					const existingParent = await ParentRepository.findByFirebaseUid(existingUser.uid);

					if (existingParent) {
						logger.warn(`[UserManagement] Parent creation failed — email already exists: ${accountEmail}`);
						throw new Error("A parent account with this email already exists");
					}

					// Link to existing Firebase account (might be a staff account)
					logger.info(`[UserManagement] Linking parent to existing Firebase account for ${accountEmail}`);
					await AuthRepository.resetPasswordToPhone(existingUser.uid, accountPhone);
					firebaseUser = existingUser;
					isLinkedExistingAccount = true;
				} else {
					logger.error(`[UserManagement] Firebase creation failed for parent ${accountEmail}: ${error.message}`);
					throw new Error(`Firebase user creation failed: ${error.message}`);
				}
			}
		} else {
			// Skip Firebase creation - assume firebaseUid is provided in parentData
			if (!parentData.firebaseUid) {
				throw new Error("firebaseUid must be provided when skipFirebaseCreation is true");
			}
			firebaseUser = { uid: parentData.firebaseUid };
		}

		// Step 2: Create parent in database
		try {
			const parent = await ParentRepository.create({
				...parentData,
				firebaseUid: firebaseUser.uid,
			});

			logger.info(`[UserManagement] Parent account created — id: ${parent.id}`);
			return parent;
		} catch (error) {
			logger.error(`[UserManagement] Parent DB creation failed for ${accountEmail}: ${error.message}`);

			// Rollback: Delete Firebase user if we created it fresh
			if (!isLinkedExistingAccount && !skipFirebaseCreation) {
				logger.warn(`[UserManagement] Rolling back Firebase user uid: ${firebaseUser.uid}`);
				try {
					await AuthRepository.deleteFirebaseUser(firebaseUser.uid);
					logger.info(`[UserManagement] Firebase rollback successful for uid: ${firebaseUser.uid}`);
				} catch (rollbackError) {
					logger.error(
						`[UserManagement] Firebase rollback failed for uid ${firebaseUser.uid}: ${rollbackError.message}. Manual cleanup required.`,
					);
					throw new Error(
						`Parent creation failed and Firebase rollback failed. Manual cleanup needed for Firebase UID: ${firebaseUser.uid}`,
					);
				}
			}

			throw error;
		}
	}

	/**
	 * Delete parent with Firebase sync
	 * @param {string} parentId - Parent ID
	 * @param {object} options - Options like forceDelete (delete even if has students)
	 * @returns {Promise<object>} - Deleted parent record
	 */
	async deleteParent(parentId, options = {}) {
		const { forceDelete = false } = options;

		logger.info(`[UserManagement] Deleting parent: ${parentId}`);

		const parent = await ParentRepository.findById(parentId);
		if (!parent) throw new Error("Parent not found");

		// Check if parent has linked students
		const hasStudents = parent.students && parent.students.length > 0;
		if (hasStudents && !forceDelete) {
			throw new Error(
				`Cannot delete parent with ${parent.students.length} linked student(s). Please delete or reassign students first.`,
			);
		}

		if (!parent.firebaseUid) {
			logger.warn(`[UserManagement] Parent ${parentId} has no firebaseUid, skipping Firebase deletion`);
			await ParentRepository.hardDelete(parentId);
			return { message: "Parent deleted successfully", hasStudents, studentCount: parent.students?.length || 0 };
		}

		// Check if Firebase account is shared
		const isShared = await this.isFirebaseAccountShared(parent.firebaseUid);
		if (isShared) {
			logger.warn(`[UserManagement] Firebase account ${parent.firebaseUid} is shared, cannot delete`);
			throw new Error(
				"Cannot delete parent - Firebase account is shared with a staff account. Please unlink or delete the staff account first.",
			);
		}

		// Step 1: Delete Firebase user
		try {
			await AuthRepository.deleteFirebaseUser(parent.firebaseUid);
			logger.info(`[UserManagement] Firebase user deleted for parent: ${parentId}`);
		} catch (error) {
			// If Firebase user doesn't exist, log warning but continue with DB deletion
			if (error.message && error.message.includes("no user record")) {
				logger.warn(`[UserManagement] Firebase user does not exist for ${parent.firebaseUid}, skipping Firebase deletion`);
			} else {
				logger.error(`[UserManagement] Firebase deletion failed for parent ${parentId}: ${error.message}`);
				throw new Error(`Firebase user deletion failed: ${error.message}`);
			}
		}

		// Step 2: Delete parent from database
		try {
			await ParentRepository.hardDelete(parentId);
			logger.info(`[UserManagement] Parent deleted: ${parentId}`);
			return { message: "Parent deleted successfully", hasStudents, studentCount: parent.students?.length || 0 };
		} catch (error) {
			logger.error(`[UserManagement] Parent DB deletion failed for ${parentId}: ${error.message}`);

			// Rollback: Recreate Firebase user
			logger.warn(`[UserManagement] Rolling back Firebase recreation for uid: ${parent.firebaseUid}`);
			try {
				await AuthRepository.createFirebaseUser(parent.accountEmail, parent.accountPhone);
				logger.info(`[UserManagement] Firebase rollback successful for uid: ${parent.firebaseUid}`);
			} catch (rollbackError) {
				logger.error(
					`[UserManagement] Firebase rollback failed for uid ${parent.firebaseUid}: ${rollbackError.message}. Manual cleanup required.`,
				);
				throw new Error(
					`Parent deletion failed and Firebase rollback failed. Manual cleanup needed for email: ${parent.accountEmail}`,
				);
			}

			throw error;
		}
	}

	/**
	 * Update parent email with Firebase sync
	 * @param {string} parentId - Parent ID
	 * @param {string} newEmail - New email address
	 * @returns {Promise<object>} - Updated parent record
	 */
	async updateParentEmail(parentId, newEmail) {
		logger.info(`[UserManagement] Updating parent email: ${parentId}`);

		const parent = await ParentRepository.findById(parentId);
		if (!parent) throw new Error("Parent not found");

		if (!parent.firebaseUid) {
			logger.warn(`[UserManagement] Parent ${parentId} has no firebaseUid, skipping Firebase email update`);
			const updated = await ParentRepository.update(parentId, { accountEmail: newEmail });
			return updated;
		}

		const oldEmail = parent.accountEmail;

		// Step 1: Update Firebase email
		try {
			await AuthRepository.updateEmail(parent.firebaseUid, newEmail);
			logger.info(`[UserManagement] Firebase email updated for parent: ${parentId}`);
		} catch (error) {
			logger.error(`[UserManagement] Firebase email update failed for parent ${parentId}: ${error.message}`);
			throw new Error(`Firebase email update failed: ${error.message}`);
		}

		// Step 2: Update database
		try {
			const updated = await ParentRepository.update(parentId, { accountEmail: newEmail });
			logger.info(`[UserManagement] Parent email updated: ${parentId}`);
			return updated;
		} catch (error) {
			logger.error(`[UserManagement] Parent DB update failed for ${parentId}: ${error.message}`);

			// Rollback: Revert Firebase email
			logger.warn(`[UserManagement] Rolling back Firebase email for uid: ${parent.firebaseUid}`);
			try {
				await AuthRepository.updateEmail(parent.firebaseUid, oldEmail);
				logger.info(`[UserManagement] Firebase rollback successful for uid: ${parent.firebaseUid}`);
			} catch (rollbackError) {
				logger.error(
					`[UserManagement] Firebase rollback failed for uid ${parent.firebaseUid}: ${rollbackError.message}. Manual cleanup required.`,
				);
				throw new Error(
					`Parent email update failed and Firebase rollback failed. Manual cleanup needed for Firebase UID: ${parent.firebaseUid}`,
				);
			}

			throw error;
		}
	}

	// ==================== STUDENT OPERATIONS ====================

	/**
	 * Delete student with optional parent Firebase cleanup
	 * @param {string} admissionNumber - Student admission number
	 * @param {string} staffId - Staff ID performing the deletion
	 * @param {object} options - Options like deleteParentIfLastChild
	 * @returns {Promise<object>} - Deletion result
	 */
	async deleteStudent(admissionNumber, staffId, options = {}) {
		const { deleteParentIfLastChild = false } = options;

		logger.info(`[UserManagement] Deleting student: ${admissionNumber}`);

		// Get student info before deletion
		const student = await StudentRepository.findByAdmissionNumber(admissionNumber);
		if (!student) throw new Error("Student not found");

		const parentId = student.parentId;

		// Delete student from database
		const result = await StudentRepository.hardDeleteAndReleaseAdmissionNumber(admissionNumber, staffId);

		// Optionally delete parent Firebase if this was the last child
		if (deleteParentIfLastChild && result.hasOtherChildren === false && parentId) {
			try {
				const parent = await ParentRepository.findById(parentId);
				if (parent && parent.firebaseUid) {
					// Check if Firebase account is shared
					const isShared = await this.isFirebaseAccountShared(parent.firebaseUid);
					if (!isShared) {
						logger.info(`[UserManagement] Deleting parent Firebase for last child: ${parentId}`);
						try {
							await AuthRepository.deleteFirebaseUser(parent.firebaseUid);
							logger.info(`[UserManagement] Parent Firebase deleted: ${parentId}`);
						} catch (error) {
							logger.error(`[UserManagement] Parent Firebase deletion failed: ${error.message}`);
							// Don't fail the entire operation - just log the error
						}
					} else {
						logger.info(`[UserManagement] Parent Firebase is shared, skipping deletion: ${parentId}`);
					}
				}
			} catch (error) {
				logger.error(`[UserManagement] Error during parent Firebase cleanup: ${error.message}`);
				// Don't fail the entire operation - just log the error
			}
		}

		logger.info(`[UserManagement] Student deleted: ${admissionNumber}`);
		return result;
	}
}

module.exports = new UserManagementService();
