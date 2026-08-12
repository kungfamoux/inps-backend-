const SearchRepository = require("../repositories/SearchRepository");
const logger = require("../../utils/logger");

class SearchService {
	async search(q, types) {
		if (!q || q.trim().length < 2) {
			throw new Error("Search query must be at least 2 characters");
		}

		const query = q.trim();
		const searchAll = !types || types.length === 0;

		logger.info(
			`Global search — query: "${query}", types: ${types?.join(", ") || "all"}`,
		);

		const [staff, students, subjects, classes] = await Promise.all([
			searchAll || types.includes("staff")
				? SearchRepository.searchStaff(query)
				: [],
			searchAll || types.includes("students")
				? SearchRepository.searchStudents(query)
				: [],
			searchAll || types.includes("subjects")
				? SearchRepository.searchSubjects(query)
				: [],
			searchAll || types.includes("classes")
				? SearchRepository.searchClasses(query)
				: [],
		]);

		const results = { staff, students, subjects, classes };

		logger.info(
			`Search complete — staff: ${staff.length}, students: ${students.length}, subjects: ${subjects.length}, classes: ${classes.length}`,
		);

		return results;
	}

	async searchStudents(query, filters = {}) {
		if (!query || query.trim().length < 2) {
			throw new Error("Search query must be at least 2 characters");
		}

		logger.info(`Students search — query: "${query}", filters:`, filters);

		const students = await SearchRepository.searchStudents(query, filters);
		const total = await SearchRepository.getCount('student', query, filters);

		return {
			data: students,
			meta: {
				total,
				page: parseInt(filters.page) || 1,
				limit: parseInt(filters.limit) || 20,
				totalPages: Math.ceil(total / (parseInt(filters.limit) || 20))
			}
		};
	}

	async searchStaff(query, filters = {}) {
		if (!query || query.trim().length < 2) {
			throw new Error("Search query must be at least 2 characters");
		}

		logger.info(`Staff search — query: "${query}", filters:`, filters);

		const staff = await SearchRepository.searchStaff(query, filters);
		const total = await SearchRepository.getCount('staff', query, filters);

		return {
			data: staff,
			meta: {
				total,
				page: parseInt(filters.page) || 1,
				limit: parseInt(filters.limit) || 20,
				totalPages: Math.ceil(total / (parseInt(filters.limit) || 20))
			}
		};
	}

	async searchParents(query, filters = {}) {
		if (!query || query.trim().length < 2) {
			throw new Error("Search query must be at least 2 characters");
		}

		logger.info(`Parents search — query: "${query}", filters:`, filters);

		const parents = await SearchRepository.searchParents(query, filters);
		const total = await SearchRepository.getCount('parent', query, filters);

		return {
			data: parents,
			meta: {
				total,
				page: parseInt(filters.page) || 1,
				limit: parseInt(filters.limit) || 20,
				totalPages: Math.ceil(total / (parseInt(filters.limit) || 20))
			}
		};
	}

	async searchClasses(query, filters = {}) {
		if (!query || query.trim().length < 2) {
			throw new Error("Search query must be at least 2 characters");
		}

		logger.info(`Classes search — query: "${query}", filters:`, filters);

		const classes = await SearchRepository.searchClasses(query, filters);
		const total = await SearchRepository.getCount('class', query, filters);

		return {
			data: classes,
			meta: {
				total,
				page: parseInt(filters.page) || 1,
				limit: parseInt(filters.limit) || 20,
				totalPages: Math.ceil(total / (parseInt(filters.limit) || 20))
			}
		};
	}

	async searchSubjects(query, filters = {}) {
		if (!query || query.trim().length < 2) {
			throw new Error("Search query must be at least 2 characters");
		}

		logger.info(`Subjects search — query: "${query}", filters:`, filters);

		const subjects = await SearchRepository.searchSubjects(query, filters);
		const total = await SearchRepository.getCount('subject', query, filters);

		return {
			data: subjects,
			meta: {
				total,
				page: parseInt(filters.page) || 1,
				limit: parseInt(filters.limit) || 20,
				totalPages: Math.ceil(total / (parseInt(filters.limit) || 20))
			}
		};
	}
}

module.exports = new SearchService();
