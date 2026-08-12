const enums = require("../../utils/enums");

describe("utils/enums", () => {
	test("every exported enum is a non-empty array of unique, non-blank strings", () => {
		const names = Object.keys(enums);
		expect(names.length).toBeGreaterThan(0);

		for (const name of names) {
			const values = enums[name];
			expect(Array.isArray(values)).toBe(true);
			expect(values.length).toBeGreaterThan(0);

			for (const value of values) {
				expect(typeof value).toBe("string");
				expect(value.trim().length).toBeGreaterThan(0);
			}

			expect(new Set(values).size).toBe(values.length);
		}
	});
});
