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

		// If accountEmail is being updated, update Firebase user as well
		if (updateData.accountEmail && updateData.accountEmail !== parent.accountEmail) {
			try {
				await AuthRepository.updateEmail(parent.firebaseUid, updateData.accountEmail);
				logger.info(`Firebase email updated for parent: ${parentId}`);
			} catch (error) {
				logger.error(`Firebase email update failed for parent ${parentId}: ${error.message}`);
				throw new Error("Failed to update Firebase email. Please try again.");
			}
		}

		// If accountPhone is being updated, reset Firebase password to new phone
		if (updateData.accountPhone && updateData.accountPhone !== parent.accountPhone) {
			try {
				await AuthRepository.resetPasswordToPhone(parent.firebaseUid, updateData.accountPhone);
				logger.info(`Firebase password reset for parent: ${parentId}`);
			} catch (error) {
				logger.error(`Firebase password reset failed for parent ${parentId}: ${error.message}`);
				throw new Error("Failed to reset Firebase password. Please try again.");
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
		logger.info(`Soft-deleting parent: ${parentId}`);

		const parent = await ParentRepository.findById(parentId);
		if (!parent) throw new Error(`Parent not found: ${parentId}`);

		if (parent.deletedAt) {
			throw new Error(`Parent already deleted: ${parentId}`);
		}

		// Check if parent has linked students
		if (parent.students && parent.students.length > 0) {
			throw new Error(
				`Cannot delete parent with ${parent.students.length} linked student(s). Please reassign or delete students first.`
			);
		}

		// Soft delete parent
		await ParentRepository.softDelete(parentId);

		// Disable Firebase user
		try {
			await AuthRepository.disableFirebaseUser(parent.firebaseUid);
			logger.info(`Firebase user disabled for parent: ${parentId}`);
		} catch (error) {
			logger.error(`Firebase user disable failed for parent ${parentId}: ${error.message}`);
			// Don't throw error - parent is already soft deleted in DB
		}

		logger.info(`Parent deleted: ${parentId}`);
		return { message: "Parent deleted successfully" };
	}
}

module.exports = new AdminParentService();
