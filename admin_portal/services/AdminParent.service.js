const ParentRepository = require("../repositories/ParentRepository");
const AuthRepository = require("../../shared/repositories/AuthRepository");
const logger = require("../../utils/logger");

class AdminParentService {
	async getAllParents(filters = {}) {
		logger.info(`Fetching all parents — filters: ${JSON.stringify(filters)}`);
		const result = await ParentRepository.findAll(filters);
		return {
			data: result.data,
			meta: result.meta,
		};
	}

	async getParentById(parentId) {
		logger.info(`Fetching parent: ${parentId}`);
		const parent = await ParentRepository.findById(parentId);
		if (!parent) throw new Error(`Parent not found: ${parentId}`);
		return parent;
	}

	async getParentByAccountEmail(accountEmail) {
		logger.info(`Fetching parent by email: ${accountEmail}`);
		const parent = await ParentRepository.findByAccountEmail(accountEmail);
		if (!parent) throw new Error(`Parent not found: ${accountEmail}`);
		return parent;
	}

	async createParent(parentData) {
		logger.info(`Creating parent with email: ${parentData.accountEmail}`);

		// Validate guardian structure
		if (!parentData.primaryGuardian) {
			throw new Error("Primary guardian information is required");
		}

		// Stringify guardian JSON fields for database storage
		const dbData = {
			...parentData,
			primaryGuardian: JSON.stringify(parentData.primaryGuardian),
			secondaryGuardian: parentData.secondaryGuardian ? JSON.stringify(parentData.secondaryGuardian) : null,
		};

		// Create Firebase user first
		let firebaseUid;
		try {
			const firebaseUser = await AuthRepository.createFirebaseUser(
				parentData.accountEmail,
				parentData.accountPhone
			);
			firebaseUid = firebaseUser.uid;
			logger.info(`Firebase user created for parent: ${parentData.accountEmail}`);
		} catch (error) {
			logger.error(`Firebase user creation failed for ${parentData.accountEmail}: ${error.message}`);
			throw new Error("Failed to create Firebase user. Please try again.");
		}

		// Add firebaseUid to parent data
		dbData.firebaseUid = firebaseUid;

		// Create parent in database
		const parent = await ParentRepository.create(dbData);
		logger.info(`Parent created: ${parent.id}`);
		return parent;
	}

	async updateParent(parentId, updateData) {
		logger.info(`Updating parent: ${parentId}`);

		const parent = await ParentRepository.findById(parentId);
		if (!parent) throw new Error(`Parent not found: ${parentId}`);

		// If parent doesn't have firebaseUid, create Firebase user with the NEW email if provided
		if (!parent.firebaseUid) {
			try {
				// Use the new email if it's being updated, otherwise use current email
				const email = updateData.accountEmail || parent.accountEmail;
				const phone = updateData.accountPhone || parent.accountPhone;
				
				const firebaseUser = await AuthRepository.createFirebaseUser(email, phone);
				parent.firebaseUid = firebaseUser.uid;
				
				// Update parent with firebaseUid
				await ParentRepository.update(parentId, { firebaseUid: firebaseUser.uid });
				logger.info(`Firebase user created for existing parent: ${parentId} with email: ${email}`);
			} catch (error) {
				logger.error(`Firebase user creation failed for parent ${parentId}: ${error.message}`);
				// Don't fail the entire update if Firebase creation fails
				logger.warn(`Parent update will proceed without Firebase account for: ${parentId}`);
			}
		}

		// If accountEmail is being updated, update Firebase user as well (only if parent has firebaseUid)
		if (updateData.accountEmail && updateData.accountEmail !== parent.accountEmail) {
			if (parent.firebaseUid) {
				try {
					await AuthRepository.updateEmail(parent.firebaseUid, updateData.accountEmail);
					logger.info(`Firebase email updated for parent: ${parentId}`);
				} catch (error) {
					logger.error(`Firebase email update failed for parent ${parentId}: ${error.message}`);
					throw new Error("Failed to update Firebase email. Please try again.");
				}
			} else {
				logger.warn(`Parent ${parentId} has no firebaseUid, skipping Firebase email update`);
			}
		}

		// If accountPhone is being updated, reset Firebase password to new phone (only if parent has firebaseUid)
		if (updateData.accountPhone && updateData.accountPhone !== parent.accountPhone) {
			if (parent.firebaseUid) {
				try {
					await AuthRepository.resetPasswordToPhone(parent.firebaseUid, updateData.accountPhone);
					logger.info(`Firebase password reset for parent: ${parentId}`);
				} catch (error) {
					logger.error(`Firebase password reset failed for parent ${parentId}: ${error.message}`);
					throw new Error("Failed to reset Firebase password. Please try again.");
				}
			} else {
				logger.warn(`Parent ${parentId} has no firebaseUid, skipping Firebase password reset`);
			}
		}

		// Stringify guardian JSON fields if present
		const dbData = { ...updateData };
		if (dbData.primaryGuardian) {
			dbData.primaryGuardian = JSON.stringify(dbData.primaryGuardian);
		}
		if (dbData.secondaryGuardian) {
			dbData.secondaryGuardian = JSON.stringify(dbData.secondaryGuardian);
		}

		const updated = await ParentRepository.update(parentId, dbData);
		logger.info(`Parent updated: ${parentId}`);
		return updated;
	}

	async deleteParent(parentId) {
		logger.info(`Deleting parent: ${parentId}`);

		const parent = await ParentRepository.findById(parentId);
		if (!parent) throw new Error(`Parent not found: ${parentId}`);

		// Check if parent has linked students
		const hasStudents = parent.students && parent.students.length > 0;
		const studentCount = hasStudents ? parent.students.length : 0;

		// Hard delete parent from database
		await ParentRepository.hardDelete(parentId);

		// Delete Firebase user
		try {
			await AuthRepository.deleteFirebaseUser(parent.firebaseUid);
			logger.info(`Firebase user deleted for parent: ${parentId}`);
		} catch (error) {
			logger.error(`Firebase user deletion failed for parent ${parentId}: ${error.message}`);
			// Don't throw error - parent is already deleted in DB
		}

		logger.info(`Parent deleted: ${parentId}`);
		return { 
			message: "Parent deleted successfully",
			hasStudents,
			studentCount
		};
	}
}

module.exports = new AdminParentService();
