require("dotenv").config({ override: true, quiet: true });
const request = require("supertest");
const app = require("../../app");
const prisma = require("../../lib/prisma");

afterAll(async () => {
	await prisma.$disconnect();
});

describe("POST /api/staff/refresh-token", () => {
	// No rate limiter and no auth on this route, so this is a clean,
	// deterministic check of the validation layer alone — never reaches
	// Firebase.
	test("rejects an empty body with a field-level validation error", async () => {
		const res = await request(app).post("/api/staff/refresh-token").send({});
		expect(res.status).toBe(400);
		expect(res.body.success).toBe(false);
		expect(res.body.errors).toHaveProperty("refreshToken");
	});
});

describe("POST /api/staff/login", () => {
	// This route sits behind loginLimiter (max 10/15min per IP), which runs
	// BEFORE validation — so repeated local test runs can legitimately hit
	// 429 instead of 400. Both are "did not crash, rejected correctly"
	// outcomes, so the assertion tolerates either rather than being flaky.
	test("rejects a request with no credentials", async () => {
		const res = await request(app).post("/api/staff/login").send({});
		expect([400, 429]).toContain(res.status);
		expect(res.body.success).toBe(false);
	});
});
