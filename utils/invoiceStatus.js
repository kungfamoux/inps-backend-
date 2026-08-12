// Pure calculation shared by ParentFeeRepository.applyPaymentToInvoice and
// the $transaction loop in parentFee.service.js (which needs `tx`, not
// `prisma`, so it can't call applyPaymentToInvoice directly). Kept free of
// any Prisma import so it can be unit-tested without a real database.
const computeInvoiceStatus = (invoice, amountPaid) => {
	const newAmountPaid = invoice.amountPaid + amountPaid;
	const newBalance = invoice.amount - newAmountPaid;
	const newStatus =
		newBalance <= 0 ? "PAID" : newAmountPaid > 0 ? "PARTIAL" : invoice.status;

	return { newAmountPaid, newBalance: Math.max(newBalance, 0), newStatus };
};

module.exports = { computeInvoiceStatus };
