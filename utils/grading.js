// Grading system (matches report card thresholds):
// A = Distinction (90 and above)
// C = Credit      (70 to 89)
// P = Pass        (55 to 69)
// F = Fail        (Below 55)
const computeGrade = (total) => {
	if (total >= 90) return "A";
	if (total >= 70) return "C";
	if (total >= 55) return "P";
	return "F";
};

module.exports = { computeGrade };
