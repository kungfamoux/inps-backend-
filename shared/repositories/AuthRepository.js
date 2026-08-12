const admin = require("../../lib/firebaseAdmin");

/**
 * AuthRepository
 */

const createFirebaseUser = async (email, phone) => {
	const defaultPassword = phone.replace(/\D/g, "");
	if (defaultPassword.length < 6) {
		throw new Error("Phone number must have at least 6 digits");
	}
	return admin
		.auth()
		.createUser({ email, password: defaultPassword, emailVerified: false });
};

const verifyIdToken = async (idToken) => {
	return admin.auth().verifyIdToken(idToken);
};

const getFirebaseUserByUid = async (uid) => {
	return admin.auth().getUser(uid);
};

const getFirebaseUserByEmail = async (email) => {
	return admin.auth().getUserByEmail(email);
};

const resetPasswordToPhone = async (uid, phone) => {
	const defaultPassword = phone.replace(/\D/g, "");
	if (defaultPassword.length < 6) {
		throw new Error("Phone number must have at least 6 digits");
	}
	return admin.auth().updateUser(uid, { password: defaultPassword });
};

const updateEmail = async (uid, newEmail) => {
	return admin.auth().updateUser(uid, { email: newEmail });
};

const updatePassword = async (uid, newPassword) => {
	return admin.auth().updateUser(uid, { password: newPassword });
};

const disableFirebaseUser = async (uid) => {
	return admin.auth().updateUser(uid, { disabled: true });
};

const enableFirebaseUser = async (uid) => {
	return admin.auth().updateUser(uid, { disabled: false });
};

const deleteFirebaseUser = async (uid) => {
	return admin.auth().deleteUser(uid);
};
const getUserByEmail = (email) => {
	return admin.auth().getUserByEmail(email);
};
module.exports = {
	createFirebaseUser,
	verifyIdToken,
	getFirebaseUserByUid,
	getFirebaseUserByEmail,
	resetPasswordToPhone,
	updateEmail,
	updatePassword,
	disableFirebaseUser,
	enableFirebaseUser,
	deleteFirebaseUser,
	getUserByEmail,
};
