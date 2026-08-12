const AUTH_ERRORS = [
	"EMAIL_NOT_FOUND",
	"INVALID_PASSWORD",
	"INVALID_LOGIN_CREDENTIALS",
	"USER_DISABLED",
	"INVALID_EMAIL",
];

const SAFE_LOGIN_ERRORS = [
	"Authentication failed",
	"Invalid email or password",
	"Your account has been deactivated. Contact the school.",
];

module.exports = { AUTH_ERRORS, SAFE_LOGIN_ERRORS };
