const axios = require("axios");
const logger = require("./logger");

if (!process.env.PAYSTACK_SECRET_KEY) {
	logger.warn("PAYSTACK_SECRET_KEY is not set — payments will fail");
}

const paystack = axios.create({
	baseURL: "https://api.paystack.co",
	timeout: 10000, // 10 seconds — fail fast if Paystack is unresponsive
	headers: {
		Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
		"Content-Type": "application/json",
	},
});

module.exports = paystack;
