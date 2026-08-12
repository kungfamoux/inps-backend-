const winston = require("winston");
const { getContext } = require("./requestContext");

winston.addColors({
	error: "bold red",
	warn: "bold yellow",
	info: "bold green",
	http: "magenta",
	debug: "blue",
});

// Merges the current request's { requestId, method, path } (set by
// middleware/requestId.js) into every log line's metadata automatically,
// so services/repositories don't need req passed down just to log it.
const injectRequestContext = winston.format((info) => {
	const ctx = getContext();
	if (ctx) Object.assign(info, ctx);
	return info;
});

const logger = winston.createLogger({
	level: "info",
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				injectRequestContext(),
				winston.format.colorize({ all: true }),
				winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
				winston.format.printf(({ timestamp, level, message, ...meta }) => {
					const extra = Object.keys(meta).length
						? ` ${JSON.stringify(meta)}`
						: "";
					return `[${timestamp}] ${level}: ${message}${extra}`;
				}),
			),
		}),
	],
});

module.exports = logger;
