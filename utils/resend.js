const { Resend } = require("resend");
const {
	brandedEmailTemplate,
	staffAccountCreationTemplate,
	parentAccountCreationTemplate,
	passwordResetTemplate,
	feePaymentConfirmationTemplate,
} = require("../templates");
const logger = require("./logger");

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.RESEND_FROM || "INPS <no-reply@inps.edu.ng>";

const sendHtmlEmail = async ({ to, subject, html }) => {
	const recipients = Array.isArray(to) ? to : [to];

	if (recipients.length === 0) {
		throw new Error("No recipients provided");
	}

	logger.info(
		`Sending email — subject: "${subject}", recipients: ${recipients.length}`,
	);

	// Resend's `to` field works like a normal email To: header — every
	// address in it is visible to every other recipient. For a single
	// recipient that's fine, but a bulk send (e.g. a newsletter to all
	// parents) must not let recipients see each other's email addresses,
	// so those go in `bcc` instead with `to` pointed at our own address.
	const recipientFields =
		recipients.length === 1
			? { to: recipients }
			: { to: FROM_ADDRESS, bcc: recipients };

	const { error } = await resend.emails.send({
		from: FROM_ADDRESS,
		...recipientFields,
		subject,
		html,
	});

	if (error) {
		logger.error(`Resend API error: ${error.message}`);
		throw new Error(`Email send failed: ${error.message}`);
	}

	logger.info(`Email sent successfully to ${recipients.length} recipient(s)`);
};

/**
 * Sends a generic branded email (newsletters, announcements, teacher-to-parent
 * messages, or any other one-off styled email).
 *
 * @param {object}          options
 * @param {string|string[]} options.to       - Recipient email(s)
 * @param {string}          options.subject  - Email subject line
 * @param {string}          options.title    - Heading shown inside the email
 * @param {string}          options.body     - Main content (supports basic HTML)
 * @param {string}          [options.footer] - Optional footer note
 * @returns {Promise<void>}
 */
const sendBrandedEmail = async ({ to, subject, title, body, footer }) => {
	const html = brandedEmailTemplate({ title, body, footer });
	await sendHtmlEmail({ to, subject, html });
};

/**
 * Sends the welcome/credentials email when a new staff account is created.
 */
const sendStaffAccountCreationEmail = async ({
	to,
	staffName,
	staffEmail,
	phoneNumber,
}) => {
	const html = staffAccountCreationTemplate({ staffName, staffEmail, phoneNumber });
	await sendHtmlEmail({
		to,
		subject: "Your Staff Portal Account Has Been Created",
		html,
	});
};

/**
 * Sends the welcome/credentials email when a new parent account is created.
 */
const sendParentAccountCreationEmail = async ({
	to,
	firstName,
	lastName,
	admissionNumber,
	accountEmail,
	accountPhone,
}) => {
	const html = parentAccountCreationTemplate({
		firstName,
		lastName,
		admissionNumber,
		accountEmail,
		accountPhone,
	});
	await sendHtmlEmail({
		to,
		subject: "Welcome to the School Portal",
		html,
	});
};

/**
 * Notifies a staff member that their password was reset to the default.
 */
const sendPasswordResetEmail = async ({
	to,
	staffName,
	staffEmail,
	phoneNumber,
	resetDate,
	adminName,
}) => {
	const html = passwordResetTemplate({
		staffName,
		staffEmail,
		phoneNumber,
		resetDate,
		adminName,
	});
	await sendHtmlEmail({
		to,
		subject: "Your Password Has Been Reset",
		html,
	});
};

/**
 * Sends a fee payment receipt/confirmation to a parent.
 */
const sendFeePaymentConfirmationEmail = async ({
	to,
	parentName,
	firstName,
	lastName,
	admissionNumber,
	billName,
	amount,
	totalAmount,
	paymentDate,
	transactionId,
	paymentMethod,
	term,
	academicYear,
}) => {
	const html = feePaymentConfirmationTemplate({
		parentName,
		firstName,
		lastName,
		admissionNumber,
		billName,
		amount,
		totalAmount,
		paymentDate,
		transactionId,
		paymentMethod,
		term,
		academicYear,
	});
	await sendHtmlEmail({
		to,
		subject: "Fee Payment Confirmation",
		html,
	});
};

module.exports = {
	sendBrandedEmail,
	sendStaffAccountCreationEmail,
	sendParentAccountCreationEmail,
	sendPasswordResetEmail,
	sendFeePaymentConfirmationEmail,
};
