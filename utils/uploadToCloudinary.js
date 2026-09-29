const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const logger = require("./logger");

/*
   CLOUDINARY CONFIG
 */

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

/*
   MULTER STORAGE
   type: "authenticated" — files are private on Cloudinary.
   They cannot be accessed via a plain URL. Access requires
   a signed URL generated server-side with an expiry.
 */

const storage = new CloudinaryStorage({
	cloudinary,
	params: async (req, file) => {
		let folder = "inps/misc";

		if (file.fieldname === "passportPhoto") {
			folder = "inps/students/passports";
		}

		if (file.fieldname === "admissionDocs") {
			folder = "inps/students/docs";
		}

		return {
			folder,
			resource_type: "auto",
			type: "authenticated", // private — requires signed URL to access
			public_id: `${Date.now()}-${file.originalname}`,
		};
	},
});

/*
   MULTER INSTANCE
 */

const upload = multer({
	storage,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB
	},
});

/*
   SIGNED URL GENERATOR
   Call this when you need to actually serve a file to the client.
   The URL expires after `expiresInSeconds` (default 1 hour).
   Store the public_id in the DB, not the signed URL — signed URLs expire.
 */

/**
 * Generates a temporary signed URL for a private Cloudinary asset.
 *
 * @param {string} publicId        — Cloudinary public_id stored in the DB
 * @param {object} [options]
 * @param {number} [options.expiresInSeconds=3600] — URL expiry (default 1 hour)
 * @param {string} [options.resourceType="image"]  — "image" | "raw" | "video"
 * @returns {string} Signed URL
 */
const generateSignedUrl = (publicId, options = {}) => {
	const { expiresInSeconds = 3600, resourceType = "image" } = options;

	const signedUrl = cloudinary.url(publicId, {
		type: "authenticated",
		resource_type: resourceType,
		sign_url: true,
		expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
		secure: true,
	});

	logger.info(
		`Signed URL generated for: ${publicId} — expires in ${expiresInSeconds}s`,
	);
	return signedUrl;
};

/*
   HELPERS
 */

const getPassportPhotoUrl = (req) => {
	return req.files?.passportPhoto?.[0]?.path ?? null;
};

const getAdmissionDocsUrls = (req) => {
	return req.files?.admissionDocs?.map((file) => file.path) ?? [];
};

/**
 * Uploads a file directly to Cloudinary (for use in update operations)
 * 
 * @param {File|Buffer} file - The file to upload
 * @param {string} folder - The Cloudinary folder (e.g., "inps/students/passports")
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadToCloudinary = async (file, folder) => {
	return new Promise((resolve, reject) => {
		cloudinary.uploader.upload_stream(
			{
				folder,
				resource_type: "auto",
				type: "authenticated",
				public_id: `${Date.now()}-${file.name || file.originalname || "file"}`,
			},
			(error, result) => {
				if (error) {
					logger.error(`Cloudinary upload error: ${error.message}`);
					reject(error);
				} else {
					logger.info(`File uploaded to Cloudinary: ${result.public_id}`);
					resolve(result);
				}
			}
		).end(file.buffer || file);
	});
};

module.exports = {
	upload,
	generateSignedUrl,
	getPassportPhotoUrl,
	getAdmissionDocsUrls,
	uploadToCloudinary,
};
