jest.mock("../../utils/logger");
const { errorHandler } = require("../../middleware/errorHandler");

const makeRes = () => {
	const res = {};
	res.status = jest.fn((code) => {
		res._status = code;
		return res;
	});
	res.json = jest.fn((body) => {
		res._body = body;
		return res;
	});
	return res;
};

const req = { id: "test-request-id", method: "GET", originalUrl: "/api/test" };

describe("errorHandler", () => {
	test("plain business-logic Error keeps its real message at 400 by default", () => {
		const res = makeRes();
		errorHandler(new Error("Student not found"), req, res, () => {});
		expect(res._status).toBe(400);
		expect(res._body.message).toBe("Student not found");
	});

	test("respects an explicit err.status override on a plain Error", () => {
		const res = makeRes();
		const err = Object.assign(new Error("Not allowed"), { status: 403 });
		errorHandler(err, req, res, () => {});
		expect(res._status).toBe(403);
		expect(res._body.message).toBe("Not allowed");
	});

	test("masks unexpected bugs (TypeError etc.) behind a generic 500", () => {
		const res = makeRes();
		errorHandler(
			new TypeError("ClassRepository.findAllSections is not a function"),
			req,
			res,
			() => {},
		);
		expect(res._status).toBe(500);
		expect(res._body.message).toBe("Internal server error.");
		expect(JSON.stringify(res._body)).not.toContain("findAllSections");
	});

	test("maps Prisma P2002 (unique constraint) to 409", () => {
		const res = makeRes();
		const err = Object.assign(new Error("dup"), {
			code: "P2002",
			meta: { target: ["email"] },
		});
		errorHandler(err, req, res, () => {});
		expect(res._status).toBe(409);
		expect(res._body.field).toEqual(["email"]);
	});

	test("maps Prisma P2025 (record not found) to 404", () => {
		const res = makeRes();
		const err = Object.assign(new Error("missing"), { code: "P2025" });
		errorHandler(err, req, res, () => {});
		expect(res._status).toBe(404);
	});

	test("maps Firebase auth/ errors to 401", () => {
		const res = makeRes();
		const err = Object.assign(new Error("Invalid token"), {
			code: "auth/id-token-expired",
		});
		errorHandler(err, req, res, () => {});
		expect(res._status).toBe(401);
		expect(res._body.message).toBe("Invalid token");
	});

	test("never includes requestId in the client-facing response body", () => {
		const cases = [
			new Error("Student not found"),
			new TypeError("bug"),
			Object.assign(new Error("dup"), { code: "P2002" }),
			Object.assign(new Error("missing"), { code: "P2025" }),
			Object.assign(new Error("bad"), { code: "auth/id-token-expired" }),
		];
		for (const err of cases) {
			const res = makeRes();
			errorHandler(err, req, res, () => {});
			expect(res._body).not.toHaveProperty("requestId");
		}
	});
});
