const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const prisma = require("./lib/prisma.js");
const adminStudentRouter = require("./admin_portal/routes/adminStudentRoutes.js");
const authRouter = require("./auth/routes/auth.routes.js");
const adminStaffRouter = require("./admin_portal/routes/adminStaffRoutes.js");
const adminSchoolConfig = require("./admin_portal/routes/adminSchoolConfigRoutes");
const adminStudentEnrollment = require("./admin_portal/routes/adminEnrollmentRoutes.js");
const finance = require("./bursary_portal/routes/financeRoutes.js");
const adminAssignmentRouter = require("./admin_portal/routes/adminAssignmentRoutes.js");
const adminSchedulesRouter = require("./admin_portal/routes/adminSchedulesRoutes.js");
const adminResultsRouter = require("./admin_portal/routes/adminResultRoutes.js");
const adminClassTeacherRouter = require("./admin_portal/routes/adminClassTeachersRoutes.js");
const teacherStudentRouter = require("./teacher_portal/routes/teacherStudentRoutes.js");
const teacherResultRouter = require("./teacher_portal/routes/teacherResultRoutes");
const parentStudentRouter = require("./parent_portal/routes/parentStudent.routes.js");
const adminSubjectsRouter = require("./admin_portal/routes/adminSubjectsRoutes.js");
const parentFeeRouter = require("./parent_portal/routes/parentFee.route");
const adminCommunicationRouter = require("./admin_portal/routes/adminCommunicationRoutes.js");
const adminClassRouter = require("./admin_portal/routes/adminClassRoutes.js");
const adminParentRouter = require("./admin_portal/routes/adminParentRoutes.js");
const adminDashboardRouter = require("./admin_portal/routes/adminDashboardRoutes.js");
const searchRouter = require("./admin_portal/routes/searchRoutes.js");
const logger = require("./utils/logger");
const requestLogger = require("./middleware/logger");
const { requestId } = require("./middleware/requestId");
const { apiLimiter } = require("./middleware/rateLimiter");
const { errorHandler } = require("./middleware/errorHandler");
const { notFound } = require("./middleware/notFound");
const setupSwagger = require("./config/swagger");

const app = express();
// Render sits in front of this app as a single reverse-proxy hop — trusting
// it means req.ip (and therefore express-rate-limit's per-IP keying) reads
// the real client IP from X-Forwarded-For instead of the proxy's own IP.
app.set("trust proxy", 1);
app.use(helmet());
// Gzips JSON responses — without this every response goes out uncompressed,
// which Lighthouse's "Enable text compression" audit flags directly and
// which slows down any frontend waiting on these payloads.
app.use(compression());
app.use(requestId);
app.use(
	cors({
		origin: process.env.CORS_ORIGIN || "*",
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
		allowedHeaders: ["Content-Type", "Authorization"],
		// Lets the browser cache the preflight result instead of sending a
		// fresh OPTIONS request before every authenticated call (Authorization
		// header triggers a preflight on virtually every request otherwise).
		maxAge: 86400,
	}),
);
app.use(
	express.json({
		// Keep the raw request bytes around so webhook signature checks
		// (e.g. Paystack) can be verified against the exact payload sent,
		// not a re-serialized copy that may differ in formatting.
		verify: (req, res, buf) => {
			req.rawBody = buf;
		},
	}),
);
app.use(requestLogger);

setupSwagger(app);

app.get("/api/health", async (req, res) => {
	try {
		await prisma.$queryRaw`SELECT 1`;
		res.json({ status: "Server is running", database: "connected" });
	} catch (err) {
		logger.error("Health check — database unreachable", {
			requestId: req.id,
			message: err.message,
		});
		res.status(503).json({ status: "Degraded", database: "disconnected" });
	}
});

app.use(apiLimiter);

app.use("/api/admin/staff", adminStaffRouter);
app.use("/api/admin/students", adminStudentRouter);
app.use("/api/admin/config", adminSchoolConfig);
app.use("/api/admin/subjects", adminSubjectsRouter);
app.use("/api/admin/assignments", adminAssignmentRouter);
app.use("/api/admin/schedules", adminSchedulesRouter);
app.use("/api/admin/results", adminResultsRouter);
app.use("/api/admin/classes", adminClassTeacherRouter);
app.use("/api/admin/enrollment", adminStudentEnrollment);
app.use("/api/finance", finance);
app.use("/api/parent/fees", parentFeeRouter);
app.use("/api/teacher/students", teacherStudentRouter);
app.use("/api/teacher/results", teacherResultRouter);
app.use("/api/parent", parentStudentRouter);
app.use("/api/staff", authRouter);
app.use("/api/admin/communications", adminCommunicationRouter);
app.use("/api/admin/classes", adminClassRouter);
app.use("/api/admin/parents", adminParentRouter);
app.use("/api/admin/dashboard", adminDashboardRouter);
app.use("/api/search", searchRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
