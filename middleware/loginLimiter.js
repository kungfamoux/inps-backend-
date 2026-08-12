const rateLimit = require("express-rate-limit");
const { PrismaRateLimitStore } = require("./PrismaRateLimitStore");

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	passOnStoreError: true,
	store: new PrismaRateLimitStore("login"),
	message: {
		success: false,
		message: "Too many login attempts. Try again later.",
	},
});

module.exports = { loginLimiter };
