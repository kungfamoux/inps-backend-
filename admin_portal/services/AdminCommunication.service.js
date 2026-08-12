const CommunicationRepository = require("../../shared/repositories/CommunicationRepository");
const { sendBrandedEmail } = require("../../utils/resend");
const logger = require("../../utils/logger");

class AdminCommunicationService {
	async create(data) {
		const { title, content, type, target, status, announcementCategory } =
			data;

		if (!title || !content || !type || !target) {
			throw new Error("Fill all required fields");
		}

		logger.info(`Creating ${type}: "${title}" — target: ${target}`);

		const communication = await CommunicationRepository.create({
			title,
			content,
			type: type ?? "NEWSLETTER",
			target: target ?? "ALL",
			status: status ?? "DRAFT",
			announcementCategory: type === "ANNOUNCEMENT" ? announcementCategory : null,
		});

		logger.info(`${type} created — id: ${communication.id}`);
		return communication;
	}

	async update(id, data) {
		logger.info(`Updating communication: ${id}`);

		const existing = await CommunicationRepository.findById(id);
		if (!existing) throw new Error("Communication not found");
		if (existing.sentAt)
			throw new Error("Cannot edit a communication that has already been sent");

		const updated = await CommunicationRepository.update(id, data);
		logger.info(`Communication updated: ${id}`);
		return updated;
	}

	async getAll(filters = {}) {
		logger.info(`Fetching communications — filters: ${JSON.stringify(filters)}`);
		return CommunicationRepository.findAll(filters);
	}

	async getById(id) {
		logger.info(`Fetching communication: ${id}`);
		const communication = await CommunicationRepository.findById(id);
		if (!communication) throw new Error("Communication not found");
		return communication;
	}

	async deleteOne(id) {
		logger.info(`Deleting communication: ${id}`);
		const existing = await CommunicationRepository.findById(id);
		if (!existing) throw new Error("Communication not found");
		if (existing.sentAt)
			throw new Error("Cannot delete a communication that has already been sent");

		const readCount = await CommunicationRepository.countReads(id);
		if (readCount > 0) {
			throw new Error(
				`Cannot delete a communication that has been read by ${readCount} parent(s).`,
			);
		}

		await CommunicationRepository.deleteOne(id);
		logger.info(`Communication deleted: ${id}`);
	}

	// PUBLISH

	async publish(id) {
		logger.info(`Publishing communication: ${id}`);

		const existing = await CommunicationRepository.findById(id);
		if (!existing) throw new Error("Communication not found");
		if (existing.status === "PUBLISHED") throw new Error("Already published");

		const updated = await CommunicationRepository.update(id, {
			status: "PUBLISHED",
			publishedAt: new Date(),
		});

		logger.info(`Published: ${id}`);
		return updated;
	}

	// SEND

	async send(id) {
		logger.info(`Sending communication via Resend: ${id}`);

		const communication = await CommunicationRepository.findById(id);
		if (!communication) throw new Error("Communication not found");
		if (communication.sentAt)
			throw new Error("This communication has already been sent");

		const emails = await this._getRecipientEmails(communication.target);

		if (emails.length === 0) {
			throw new Error("No recipients found for the selected target");
		}

		logger.info(
			`Dispatching to ${emails.length} recipient(s) — target: ${communication.target}`,
		);

		await sendBrandedEmail({
			to: emails,
			subject: communication.title,
			title: communication.title,
			body: communication.content,
		});

		const updated = await CommunicationRepository.update(id, {
			status: "PUBLISHED",
			publishedAt: communication.publishedAt ?? new Date(),
			sentAt: new Date(),
		});

		logger.info(`Communication sent successfully: ${id}`);
		return updated;
	}

	async _getRecipientEmails(target) {
		const emails = new Set();

		if (target === "PARENTS" || target === "ALL") {
			const parents = await CommunicationRepository.findParentEmails();
			parents.forEach((p) => {
				if (p.accountEmail) emails.add(p.accountEmail);
			});
		}

		if (target === "STAFF" || target === "ALL") {
			const staff = await CommunicationRepository.findStaffEmails();
			staff.forEach((s) => {
				if (s.email) emails.add(s.email);
			});
		}

		return Array.from(emails);
	}
}

module.exports = new AdminCommunicationService();
