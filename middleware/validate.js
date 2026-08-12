/**
 * validate
 *
 * Route-level request validation using Zod schemas.
 * On success, replaces the target request property (body/query/params) with
 * the parsed (and type-coerced) data so downstream code can trust its shape.
 * On failure, responds 400 with a field-level error breakdown.
 *
 * Usage:
 *   router.post("/", validate(createStudentSchema), createStudent);
 *   router.get("/", validate(listQuerySchema, "query"), getAllStudents);
 */
const validate =
	(schema, source = "body") =>
	(req, res, next) => {
		const result = schema.safeParse(req[source]);

		if (!result.success) {
			const { fieldErrors, formErrors } = result.error.flatten();
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: fieldErrors,
				...(formErrors.length ? { formErrors } : {}),
			});
		}

		req[source] = result.data;
		next();
	};

module.exports = { validate };
