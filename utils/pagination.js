/**
 * utils/pagination.js
 *
 * Reusable pagination helpers.
 * Parses page/limit from query params, enforces limits, and generates
 * the standard pagination metadata block returned in all list responses.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parses and validates pagination params from sanitized query params.
 *
 * @param {object} query  - Sanitized req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
function parsePagination(query = {}) {
	let page = parseInt(query.page, 10);
	let limit = parseInt(query.limit, 10);

	if (!Number.isFinite(page) || page < 1) page = DEFAULT_PAGE;
	if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
	if (limit > MAX_LIMIT) limit = MAX_LIMIT;

	const skip = (page - 1) * limit;

	return { page, limit, skip };
}

/**
 * Generates the pagination metadata object included in all list responses.
 *
 * @param {object} params
 * @param {number} params.page
 * @param {number} params.limit
 * @param {number} params.totalItems
 * @returns {object} Standard pagination block
 */
function buildPaginationMeta({ page, limit, totalItems }) {
	const totalPages = Math.ceil(totalItems / limit);

	return {
		page,
		limit,
		totalItems,
		totalPages,
		hasNextPage: page < totalPages,
		hasPreviousPage: page > 1,
	};
}

module.exports = {
	parsePagination,
	buildPaginationMeta,
	DEFAULT_PAGE,
	DEFAULT_LIMIT,
	MAX_LIMIT,
};
