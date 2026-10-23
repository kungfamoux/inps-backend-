const ParentRepository = require("../repositories/ParentRepository");
const AuthRepository = require("../../shared/repositories/AuthRepository");
const logger = require("../../utils/logger");
const UserManagementService = require("../../shared/services/UserManagementService");

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

		// Use UserManagementService for atomic Firebase+DB creation
		const parent = await UserManagementService.createParent(dbData);

		logger.info(`Parent created: ${parent.id}`);
		return parent;
	}

	async updateParent(parentId, updateData) {
		logger.info(`Updating parent: ${parentId}`);

		const parent = await ParentRepository.findById(parentId);
		if (!parent) throw new Error(`Parent not found: ${parentId}`);

		// If accountEmail is being updated, use UserManagementService for atomic Firebase+DB update
		if (updateData.accountEmail && updateData.accountEmail !== parent.accountEmail) {
			if (parent.firebaseUid) {
				const updated = await UserManagementService.updateParentEmail(parentId, updateData.accountEmail);
				// Update parent object to reflect the change
				parent.accountEmail = updateData.accountEmail;
				// Remove accountEmail from updateData to avoid double update
				delete updateData.accountEmail;
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

		if (hasStudents) {
			throw new Error(
				`Cannot delete parent with ${studentCount} linked student(s). Please delete or reassign students first.`,
			);
		}

		// Use UserManagementService for atomic Firebase+DB deletion
		const result = await UserManagementService.deleteParent(parentId);

		logger.info(`Parent deleted: ${parentId}`);
		return result;
	}
}

module.exports = new AdminParentService();
