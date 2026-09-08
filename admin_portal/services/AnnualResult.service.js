const AnnualResultRepository = require("../repositories/AnnualResultRepository");
const { computeGrade } = require("../../utils/grading");
const logger = require("../../utils/logger");

class AnnualResultService {
	// Calculate cumulative score across all terms
	calculateCumulativeScores(termResults) {
		// Group results by subject
		const subjectMap = new Map();

		for (const result of termResults) {
			const subjectId = result.subjectId;
			
			if (!subjectMap.has(subjectId)) {
				subjectMap.set(subjectId, {
					subjectId,
					subjectName: result.subject.subjectName,
					subjectCode: result.subject.subjectCode,
					firstTerm: null,
					secondTerm: null,
					thirdTerm: null,
					cumulative: 0,
					termCount: 0,
				});
			}

			const entry = subjectMap.get(subjectId);
			const term = result.term.term;

			if (term === "FIRST_TERM") {
				entry.firstTerm = result.total || 0;
			} else if (term === "SECOND_TERM") {
				entry.secondTerm = result.total || 0;
			} else if (term === "THIRD_TERM") {
				entry.thirdTerm = result.total || 0;
			}

			entry.cumulative += result.total || 0;
			entry.termCount += 1;
		}

		return Array.from(subjectMap.values());
	}

	// Calculate annual grade based on cumulative score (max 300)
	calculateAnnualGrade(cumulativeScore) {
		// Adapt grading scale for 300-point max
		// A = 270+ (90% average)
		// C = 210-269 (70-89% average)
		// P = 165-209 (55-69% average)
		// F = <165 (below 55% average)
		if (cumulativeScore >= 270) return "A";
		if (cumulativeScore >= 210) return "C";
		if (cumulativeScore >= 165) return "P";
		return "F";
	}

	// Calculate weighted average across terms
	calculateWeightedAverage(cumulativeScore) {
		return cumulativeScore / 3;
	}

	// Generate annual report card data for a student
	async generateAnnualReportCardData(studentId, sessionId) {
		try {
			logger.info(`Generating annual report card for student: ${studentId}, session: ${sessionId}`);

			// Fetch session details
			const prisma = require("../../lib/prisma");
			const session = await prisma.academicSession.findUnique({
				where: { id: sessionId },
				select: { session: true },
			});

			if (!session) {
				throw new Error("Session not found");
			}

			// Fetch student profile with class information
			const student = await AnnualResultRepository.getStudentProfileWithClass(
				studentId,
				session.session,
			);

			// Get all results across all terms
			const termResults = await AnnualResultRepository.getStudentAnnualResults(
				studentId,
				sessionId,
			);

			if (termResults.length === 0) {
				throw new Error("No results found for this student in the session");
			}

			// Calculate cumulative scores
			const cumulativeResults = this.calculateCumulativeScores(termResults);

			// Get annual positions for the class
			let annualPositions = [];
			if (student.classId) {
				annualPositions = await AnnualResultRepository.computeAnnualPositions(
					student.classId,
					session.session,
				);
			}

			// Merge positions with cumulative results
			const resultsWithPositions = cumulativeResults.map((result) => {
				const positionEntry = annualPositions.find(
					(p) => p.subjectId === result.subjectId && p.studentId === studentId,
				);
				
				const weightedAverage = this.calculateWeightedAverage(result.cumulative);
				const annualGrade = this.calculateAnnualGrade(result.cumulative);
				
				// Determine remark based on grade
				const remark = this.getGradeRemark(annualGrade);

				return {
					...result,
					weightedAverage: parseFloat(weightedAverage.toFixed(2)),
					annualGrade,
					annualPosition: positionEntry?.annualPosition || null,
					remark,
				};
			});

			// Get class statistics
			let classStats = null;
			if (student.classId) {
				const ageStats = await AnnualResultRepository.calculateClassAgeAverage(
					student.classId,
					session.session,
				);
				const enrollmentCount = await AnnualResultRepository.getClassEnrollmentCount(
					student.classId,
					session.session,
				);

				classStats = {
					ageAverage: ageStats.averageAge,
					classSize: enrollmentCount,
				};
			}

			// Get annual remarks
			const remarks = await AnnualResultRepository.getAnnualRemarks(
				studentId,
				sessionId,
			);

			// Calculate summary statistics
			const totalSubjects = resultsWithPositions.length;
			const totalCumulative = resultsWithPositions.reduce(
				(sum, r) => sum + r.cumulative,
				0,
			);
			const averageCumulative = totalSubjects > 0 ? totalCumulative / totalSubjects : 0;
			const passedSubjects = resultsWithPositions.filter(
				(r) => r.annualGrade !== "F",
			).length;

			return {
				student,
				sessionId,
				sessionName: session.session,
				results: resultsWithPositions,
				classStats,
				remarks,
				summary: {
					totalSubjects,
					totalCumulative,
					averageCumulative: parseFloat(averageCumulative.toFixed(2)),
					passedSubjects,
					overallPercentage: totalSubjects > 0 
						? parseFloat((averageCumulative / 3).toFixed(2))
						: 0,
				},
			};
		} catch (error) {
			logger.error("Error generating annual report card data:", error);
			throw error;
		}
	}

	// Get grade remark based on grade
	getGradeRemark(grade) {
		const remarks = {
			A: "DISTINCTION",
			C: "CREDIT",
			P: "PASS",
			F: "FAIL",
		};
		return remarks[grade] || grade;
	}

	// Generate annual statistics for a class
	async generateClassAnnualStatistics(classId, sessionId) {
		try {
			logger.info(`Generating annual statistics for class: ${classId}, session: ${sessionId}`);

			// Get all results for the class
			const results = await AnnualResultRepository.getClassAnnualResults(
				classId,
				sessionId,
			);

			// Calculate cumulative scores for each student
			const studentCumulativeMap = new Map();

			for (const result of results) {
				const key = `${result.studentId}_${result.subjectId}`;
				
				if (!studentCumulativeMap.has(key)) {
					studentCumulativeMap.set(key, {
						studentId: result.studentId,
						student: result.student,
						subjectId: result.subjectId,
						subjectName: result.subject.subjectName,
						cumulative: 0,
					});
				}

				const entry = studentCumulativeMap.get(key);
				entry.cumulative += result.total || 0;
			}

			// Group by student for overall statistics
			const studentMap = new Map();

			for (const entry of studentCumulativeMap.values()) {
				if (!studentMap.has(entry.studentId)) {
					studentMap.set(entry.studentId, {
						studentId: entry.studentId,
						student: entry.student,
						totalCumulative: 0,
						subjectCount: 0,
						subjects: [],
					});
				}

				const studentEntry = studentMap.get(entry.studentId);
				studentEntry.totalCumulative += entry.cumulative;
				studentEntry.subjectCount += 1;
				studentEntry.subjects.push({
					subjectName: entry.subjectName,
					cumulative: entry.cumulative,
					grade: this.calculateAnnualGrade(entry.cumulative),
				});
			}

			const studentStats = Array.from(studentMap.values()).map((stat) => ({
				...stat,
				averageCumulative: stat.subjectCount > 0 
					? stat.totalCumulative / stat.subjectCount 
					: 0,
				overallGrade: this.calculateAnnualGrade(stat.totalCumulative),
			}));

			// Calculate class averages
			const totalStudents = studentStats.length;
			const classTotalCumulative = studentStats.reduce(
				(sum, s) => sum + s.totalCumulative,
				0,
			);
			const classAverageCumulative = totalStudents > 0 
				? classTotalCumulative / totalStudents 
				: 0;

			// Get class age statistics
			const ageStats = await AnnualResultRepository.calculateClassAgeAverage(
				classId,
				sessionId,
			);

			return {
				classId,
				sessionId,
				totalStudents,
				classAverageCumulative: parseFloat(classAverageCumulative.toFixed(2)),
				classAveragePercentage: parseFloat((classAverageCumulative / 3).toFixed(2)),
				classAgeAverage: ageStats.averageAge,
				studentStatistics: studentStats,
			};
		} catch (error) {
			logger.error("Error generating class annual statistics:", error);
			throw error;
		}
	}

	// Generate batch annual report cards for a class
	async generateBatchAnnualReportCards(classId, sessionId) {
		try {
			logger.info(
				`Generating batch annual report cards for class: ${classId}, session: ${sessionId}`,
			);

			const enrollments = await AnnualResultRepository.getClassEnrollmentCount(
				classId,
				sessionId,
			);

			if (enrollments === 0) {
				throw new Error("No students found in this class for the session");
			}

			// Get all students in the class
			const prisma = require("../../lib/prisma");
			const students = await prisma.enrollment.findMany({
				where: {
					classId,
					academicYear: sessionId,
					status: "ACTIVE",
				},
				select: {
					studentId: true,
					student: {
						select: {
							id: true,
							admissionNumber: true,
							firstName: true,
							lastName: true,
						},
					},
				},
			});

			// Generate report card data for each student
			const reportCards = [];
			for (const enrollment of students) {
				try {
					const data = await this.generateAnnualReportCardData(
						enrollment.studentId,
						sessionId,
					);
					reportCards.push({
						studentId: enrollment.studentId,
						studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
						admissionNumber: enrollment.student.admissionNumber,
						data,
					});
				} catch (error) {
					logger.error(
						`Error generating report card for student ${enrollment.studentId}:`,
						error,
					);
					// Continue with other students even if one fails
				}
			}

			return {
				totalRequested: students.length,
				successful: reportCards.length,
				failed: students.length - reportCards.length,
				reportCards,
			};
		} catch (error) {
			logger.error("Error generating batch annual report cards:", error);
			throw error;
		}
	}
}

module.exports = new AnnualResultService();
