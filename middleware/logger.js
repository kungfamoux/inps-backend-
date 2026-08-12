const morgan = require("morgan");
const logger = require("../utils/logger");

morgan.token("id", (req) => req.id);

const stream = {
	write: (message) => logger.info(message.trim()),
};

const requestLogger = morgan(
	"[:id] :method :url :status :response-time ms",
	{ stream },
);

module.exports = requestLogger;
