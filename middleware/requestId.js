const crypto = require("crypto");
const { runWithContext } = require("../utils/requestContext");

// Tags every request with a unique id so a single event can be traced
// across the access log line, any error log line, and the client-visible
// error response — useful when a user reports "it broke" with no other detail.
// Running the rest of the request inside runWithContext also means every
// logger.* call anywhere in this request's async chain (service, repository,
// etc.) automatically picks up requestId/method/path — see utils/logger.js.
const requestId = (req, res, next) => {
	req.id = crypto.randomUUID();
	res.setHeader("X-Request-Id", req.id);
	runWithContext({ requestId: req.id, method: req.method, path: req.originalUrl }, next);
};

module.exports = { requestId };
