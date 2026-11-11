const HealthRepository = require("../repositories/HealthRepository");
const { generateSignedUrl, uploadToCloudinary } = require("../../utils/uploadToCloudinary");
const logger = require("../../utils/logger");

const signHealthImages = (data) => {
	if (!data) return data;

	// Sign drug request list image
	if (data.listImage) {
		data.listImage = generateSignedUrl(data.listImage, {
			expiresInSeconds: 3600,
			resourceType: "image",
		});
	}

	// Sign drug purchase images
	if (data.purchases) {
		data.purchases = data.purchases.map((purchase) => {
			if (purchase.invoiceImage) {
				purchase.invoiceImage = generateSignedUrl(purchase.invoiceImage, {
					expiresInSeconds: 3600,
					resourceType: "image",
				});
			}
			if (purchase.receiptImage) {
				purchase.receiptImage = generateSignedUrl(purchase.receiptImage, {
					expiresInSeconds: 3600,
					resourceType: "image",
				});
			}
			return purchase;
		});
	}

	// Sign sickbay visit daily image
	if (data.dailyImage) {
		data.dailyImage = generateSignedUrl(data.dailyImage, {
			expiresInSeconds: 3600,
			resourceType: "image",
		});
	}

	return data;
};

class HealthService {
	// Drug Request Methods
	async submitDrugRequest(nurseId, listImage, notes) {
		if (!nurseId) throw new Error("Nurse ID is required");
		if (!listImage) throw new Error("Drug list image is required");

		const drugRequest = await HealthRepository.createDrugRequest({
			nurseId,
			listImage,
			notes,
		});

		logger.info(`Drug request created: ${drugRequest.id} by nurse ${nurseId}`);
		return drugRequest;
	}

	async getDrugRequestsList() {
		const requests = await HealthRepository.getDrugRequests();
		return requests.map((request) => signHealthImages(request));
	}

	async getDrugRequest(id) {
		const request = await HealthRepository.getDrugRequestById(id);
		if (!request) throw new Error("Drug request not found");
		return signHealthImages(request);
	}

	async updateRequestStatus(requestId, status) {
		if (!requestId) throw new Error("Request ID is required");
		if (!status) throw new Error("Status is required");

		const validStatuses = ["PENDING", "COMPLETED", "CANCELLED"];
		if (!validStatuses.includes(status)) {
			throw new Error("Invalid status");
		}

		const request = await HealthRepository.updateDrugRequestStatus(
			requestId,
			status
		);
		logger.info(`Drug request ${requestId} status updated to ${status}`);
		return request;
	}

	// Drug Purchase Methods
	async recordDrugPurchase(
		requestId,
		invoiceImage,
		receiptImage,
		amount,
		supplier,
		notes
	) {
		if (!requestId) throw new Error("Request ID is required");
		if (!invoiceImage) throw new Error("Invoice image is required");
		if (!receiptImage) throw new Error("Receipt image is required");

		const purchase = await HealthRepository.createDrugPurchase({
			requestId,
			invoiceImage,
			receiptImage,
			amount: amount ? parseFloat(amount) : null,
			supplier,
			notes,
		});

		logger.info(`Drug purchase recorded for request ${requestId}`);
		return purchase;
	}

	async getDrugPurchases(requestId) {
		if (!requestId) throw new Error("Request ID is required");

		const purchases = await HealthRepository.getPurchasesByRequestId(requestId);
		return purchases.map((purchase) => signHealthImages(purchase));
	}

	// Sickbay Visit Methods
	async recordSickbayVisit(
		studentId,
		nurseId,
		symptoms,
		treatment,
		medication,
		notes
	) {
		if (!studentId) throw new Error("Student ID is required");
		if (!nurseId) throw new Error("Nurse ID is required");
		if (!symptoms) throw new Error("Symptoms are required");
		if (!treatment) throw new Error("Treatment is required");

		const visit = await HealthRepository.createSickbayVisit({
			studentId,
			nurseId,
			symptoms,
			treatment,
			medication,
			notes,
		});

		logger.info(`Sickbay visit recorded: ${visit.id} for student ${studentId}`);
		return visit;
	}

	async getSickbayVisitsHistory(studentId, startDate, endDate) {
		const visits = await HealthRepository.getSickbayVisits({
			studentId,
			startDate,
			endDate,
		});
		return visits.map((visit) => signHealthImages(visit));
	}

	async updateSickbayVisit(visitId, symptoms, treatment, medication, notes) {
		if (!visitId) throw new Error("Visit ID is required");

		const updateData = {};
		if (symptoms !== undefined) updateData.symptoms = symptoms;
		if (treatment !== undefined) updateData.treatment = treatment;
		if (medication !== undefined) updateData.medication = medication;
		if (notes !== undefined) updateData.notes = notes;

		const visit = await HealthRepository.updateSickbayVisit(visitId, updateData);
		logger.info(`Sickbay visit ${visitId} updated`);
		return visit;
	}

	// Daily Visitor Log Methods
	async uploadDailyVisitorLog(date, image) {
		if (!date) throw new Error("Date is required");
		if (!image) throw new Error("Image is required");

		await HealthRepository.updateDailyVisitorLog(date, image);
		logger.info(`Daily visitor log uploaded for ${date}`);
		return { success: true, message: "Daily visitor log uploaded" };
	}

	async getDailyVisitorLog(date) {
		if (!date) throw new Error("Date is required");

		const image = await HealthRepository.getDailyVisitorLog(date);
		if (!image) return null;

		return generateSignedUrl(image, {
			expiresInSeconds: 3600,
			resourceType: "image",
		});
	}

	async getDailyVisits(date) {
		if (!date) throw new Error("Date is required");

		const visits = await HealthRepository.getDailyVisits(date);
		return visits.map((visit) => signHealthImages(visit));
	}
}

module.exports = new HealthService();
