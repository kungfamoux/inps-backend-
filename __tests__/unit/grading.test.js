const { computeGrade } = require("../../utils/grading");

describe("computeGrade", () => {
	test("returns A for distinction (90 and above)", () => {
		expect(computeGrade(90)).toBe("A");
		expect(computeGrade(100)).toBe("A");
	});

	test("returns C for credit (70 to 89)", () => {
		expect(computeGrade(70)).toBe("C");
		expect(computeGrade(89)).toBe("C");
	});

	test("returns P for pass (55 to 69)", () => {
		expect(computeGrade(55)).toBe("P");
		expect(computeGrade(69)).toBe("P");
	});

	test("returns F below 55", () => {
		expect(computeGrade(54)).toBe("F");
		expect(computeGrade(0)).toBe("F");
	});
});
