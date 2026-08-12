const rateLimit = require("express-rate-limit");
const { PrismaRateLimitStore } = require("./PrismaRateLimitStore");

// Baseline guard applied to the whole API. Generous enough not to bother
// normal usage, tight enough to blunt casual scripted abuse.
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 300,
	standardHeaders: true,
	legacyHeaders: false,

	passOnStoreError: true,
	store: new PrismaRateLimitStore("api"),
	message: {
		success: false,
		message: "Too many requests. Please try again later.",
	},
});

// Paystack retries a webhook delivery on failure, so this stays generous,
// but still caps runaway/replayed traffic before it reaches HMAC verification.
const webhookLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,

	passOnStoreError: true,
	store: new PrismaRateLimitStore("webhook"),
	message: {
		success: false,
		message: "Too many webhook requests. Please try again later.",
	},
});

// Heavier aggregate/report endpoints (financial summaries, debtor lists,
// search) do more DB work per request than a typical CRUD call.
const reportLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 30,
	standardHeaders: true,
	legacyHeaders: false,

	passOnStoreError: true,
	store: new PrismaRateLimitStore("report"),
	message: {
		success: false,
		message: "Too many report requests. Please slow down and try again later.",
	},
});

module.exports = { apiLimiter, webhookLimiter, reportLimiter };
