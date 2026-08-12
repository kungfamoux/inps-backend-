// Integration tests hit the real app (real DB + Firebase), so they need a
// working .env locally. Not run in CI, which has no provisioned secrets —
// see .github/workflows/ci.yml for what CI actually runs.
require("dotenv").config({ override: true, quiet: true });
const request = require("supertest");
const app = require("../../app");
const prisma = require("../../lib/prisma");

afterAll(async () => {
	await prisma.$disconnect();
});

describe("GET /api/health", () => {
	test("reports the server running and the database connected", async () => {
		const res = await request(app).get("/api/health");
		expect(res.status).toBe(200);
		expect(res.body).toEqual({
			status: "Server is running",
			database: "connected",
		});
	});
});
