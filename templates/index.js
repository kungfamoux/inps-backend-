const fs = require("fs");
const path = require("path");

const load = (file) => fs.readFileSync(path.join(__dirname, file), "utf8");

const brandedEmailHtml = load("brandedEmail.html");
const staffAccountCreationHtml = load("staff-account-creation.html");
const parentAccountCreationHtml = load("parent-account-creation.html");
const passwordResetHtml = load("password-reset.html");
const feePaymentConfirmationHtml = load("fee-payment-confirmation.html");

const toText = (value) => (value ?? "").toString();

const portalLink = (override) =>
	override ||
	process.env.PORTAL_URL ||
	"https://portal.inpse.com" ||
	"#";

// Shared footer placeholders present on every template.
const fillBranding = (html, { portalLink: link } = {}) =>
	html
		.replace("[PORTAL_LINK]", portalLink(link))
		.replace("[Phone Number]", process.env.SCHOOL_PHONE || "")
		.replace("[School Website URL]", process.env.SCHOOL_WEBSITE || "");

/**
 * Fills in the generic branded email template — used for newsletters,
 * announcements, and any other styled one-off email (e.g. teacher-to-parent).
 * `body` is inserted as-is (author-provided content may contain basic HTML);
 * everything else is plain text.
 */
const brandedEmailTemplate = ({ title, body, footer, portalLink } = {}) => {
	const html = brandedEmailHtml
		.replace("[TITLE]", toText(title))
		.replace("[BODY]", toText(body))
		.replace("[FOOTER]", toText(footer));
	return fillBranding(html, { portalLink });
};

const staffAccountCreationTemplate = ({
	staffName,
	staffEmail,
	phoneNumber,
	portalLink,
} = {}) => {
	const html = staffAccountCreationHtml
		.replace("[STAFF_NAME]", toText(staffName))
		.replace("[STAFF_EMAIL]", toText(staffEmail))
		.replace("[PHONE_NUMBER]", toText(phoneNumber));
	return fillBranding(html, { portalLink });
};

const parentAccountCreationTemplate = ({
	firstName,
	lastName,
	admissionNumber,
	accountEmail,
	accountPhone,
	portalLink,
} = {}) => {
	const html = parentAccountCreationHtml
		.replace("[FIRST_NAME]", toText(firstName))
		.replace("[LAST_NAME]", toText(lastName))
		.replace("[ADMISSION_NUMBER]", toText(admissionNumber))
		.replace("[ACCOUNT_EMAIL]", toText(accountEmail))
		.replace("[ACCOUNT_PHONE]", toText(accountPhone));
	return fillBranding(html, { portalLink });
};

const passwordResetTemplate = ({
	staffName,
	staffEmail,
	phoneNumber,
	resetDate,
	adminName,
	portalLink,
} = {}) => {
	const html = passwordResetHtml
		.replace("[STAFF_NAME]", toText(staffName))
		.replace("[RESET_DATE]", toText(resetDate))
		.replace("[ADMIN_NAME]", toText(adminName))
		.replace("[STAFF_EMAIL]", toText(staffEmail))
		.replace("[PHONE_NUMBER]", toText(phoneNumber));
	return fillBranding(html, { portalLink });
};

const feePaymentConfirmationTemplate = ({
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
	portalLink,
} = {}) => {
	const html = feePaymentConfirmationHtml
		.replace("[PARENT_NAME]", toText(parentName))
		.replace("[FIRST_NAME]", toText(firstName))
		.replace("[LAST_NAME]", toText(lastName))
		.replace("[ADMISSION_NUMBER]", toText(admissionNumber))
		.replace("[BILL_NAME]", toText(billName))
		.replace("[AMOUNT]", toText(amount))
		.replace("[TOTAL_AMOUNT]", toText(totalAmount))
		.replace("[PAYMENT_DATE]", toText(paymentDate))
		.replace("[TRANSACTION_ID]", toText(transactionId))
		.replace("[PAYMENT_METHOD]", toText(paymentMethod))
		.replace("[TERM]", toText(term))
		.replace("[ACADEMIC_YEAR]", toText(academicYear));
	return fillBranding(html, { portalLink });
};

module.exports = {
	brandedEmailTemplate,
	staffAccountCreationTemplate,
	parentAccountCreationTemplate,
	passwordResetTemplate,
	feePaymentConfirmationTemplate,
};
