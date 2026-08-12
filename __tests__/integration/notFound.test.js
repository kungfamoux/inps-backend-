require("dotenv").config({ override: true, quiet: true });
const request = require("supertest");
const app = require("../../app");
const prisma = require("../../lib/prisma");

afterAll(async () => {
	await prisma.$disconnect();
});

describe("unmatched routes", () => {
	test("returns a clean 404 instead of crashing", async () => {
		const res = await request(app).get("/api/this-route-does-not-exist");
		expect(res.status).toBe(404);
		expect(res.body).toEqual({
			success: false,
			message: "Route not found: GET /api/this-route-does-not-exist",
		});
	});
});
