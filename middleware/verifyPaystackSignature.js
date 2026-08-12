const crypto = require("crypto");

const verifyPaystackSignature = (req, res, next) => {
	const signature = req.headers["x-paystack-signature"];

	if (!signature) {
		return res.status(401).json({
			success: false,
			message: "Missing Paystack signature",
		});
	}

	// Hash the exact bytes Paystack sent (captured by express.json's `verify`
	// option in server.js). Re-serializing req.body with JSON.stringify can
	// produce a different byte sequence than what was actually transmitted,
	// causing valid webhooks to fail signature checks.
	if (!req.rawBody) {
		return res.status(400).json({
			success: false,
			message: "Missing request body",
		});
	}

	const hash = crypto
		.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
		.update(req.rawBody)
		.digest("hex");

	const expected = Buffer.from(hash, "utf8");
	const received = Buffer.from(signature, "utf8");

	const isValid =
		expected.length === received.length &&
		crypto.timingSafeEqual(expected, received);

	if (!isValid) {
		return res.status(401).json({
			success: false,
			message: "Invalid Paystack signature",
		});
	}

	next();
};

module.exports = { verifyPaystackSignature };
