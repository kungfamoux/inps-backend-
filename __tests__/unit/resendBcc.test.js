// Regression test for a real privacy bug: bulk sends (e.g. a newsletter to
// all parents) used to put every recipient in the same `to` array, which
// Resend (like a normal email To: header) shows to every other recipient —
// so each parent could see every other parent's email address.
const mockSend = jest.fn().mockResolvedValue({ error: null });

jest.mock("resend", () => ({
	Resend: jest.fn().mockImplementation(() => ({
		emails: { send: mockSend },
	})),
}));
jest.mock("../../utils/logger");

const { sendBrandedEmail } = require("../../utils/resend");

beforeEach(() => {
	mockSend.mockClear();
});

describe("sendBrandedEmail recipient privacy", () => {
	test("a single recipient is addressed directly via `to`", async () => {
		await sendBrandedEmail({
			to: "parent@example.com",
			subject: "Test",
			title: "Test",
			body: "Body",
		});

		const payload = mockSend.mock.calls[0][0];
		expect(payload.to).toEqual(["parent@example.com"]);
		expect(payload.bcc).toBeUndefined();
	});

	test("multiple recipients go in bcc, never in the shared `to` field", async () => {
		const parents = ["parent1@example.com", "parent2@example.com", "parent3@example.com"];

		await sendBrandedEmail({
			to: parents,
			subject: "Test",
			title: "Test",
			body: "Body",
		});

		const payload = mockSend.mock.calls[0][0];
		expect(payload.bcc).toEqual(parents);
		expect(payload.to).not.toEqual(expect.arrayContaining(parents));
		for (const parent of parents) {
			expect(payload.to).not.toContain(parent);
		}
	});
});
