const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerOptions = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "School Portal API",
			version: "1.0.0",
			description: "Multi-portal API documentation (Admin, Parent, etc.)",
		},

		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
			// Every handler in this codebase replies through the same envelope
			// (see middleware/errorHandler.js): { success, message, ...data }.
			// These are shared across every route's `responses:` block via $ref
			// instead of being redefined per endpoint.
			schemas: {
				ErrorResponse: {
					type: "object",
					properties: {
						success: { type: "boolean", example: false },
						message: { type: "string" },
					},
				},
				UnauthorizedResponse: {
					type: "object",
					properties: {
						success: { type: "boolean", example: false },
						message: { type: "string", example: "No token provided" },
					},
				},
				ForbiddenResponse: {
					type: "object",
					properties: {
						success: { type: "boolean", example: false },
						message: {
							type: "string",
							example: "Access denied. Teaching staff only.",
						},
					},
				},
				NotFoundResponse: {
					type: "object",
					properties: {
						success: { type: "boolean", example: false },
						message: { type: "string", example: "Record not found." },
					},
				},
				ConflictResponse: {
					type: "object",
					properties: {
						success: { type: "boolean", example: false },
						message: {
							type: "string",
							example: "A record with this value already exists.",
						},
						field: { type: "string", nullable: true },
					},
				},
				ServerErrorResponse: {
					type: "object",
					properties: {
						success: { type: "boolean", example: false },
						message: { type: "string", example: "Internal server error." },
					},
				},
			},
			responses: {
				UnauthorizedError: {
					description: "Missing, invalid, or expired auth token",
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/UnauthorizedResponse" },
						},
					},
				},
				ForbiddenError: {
					description: "Authenticated but not permitted to perform this action",
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/ForbiddenResponse" },
						},
					},
				},
				NotFoundError: {
					description: "Resource not found",
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/NotFoundResponse" },
						},
					},
				},
				ServerError: {
					description: "Unexpected server error",
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/ServerErrorResponse" },
						},
					},
				},
			},
		},

		security: [
			{
				bearerAuth: [],
			},
		],

		servers: [
			{
				url:
					process.env.RENDER_EXTERNAL_URL ||
					process.env.BASE_URL ||
					"http://localhost:3000",
			},
		],
	},

	apis: [
		"./admin_portal/routes/*.js",
		"./parent_portal/routes/*.js",
		"./teacher_portal/routes/*.js",
		"./bursary_portal/routes/*.js",
		"./auth/routes/*.js",
	],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const setupSwagger = (app) => {
	app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
