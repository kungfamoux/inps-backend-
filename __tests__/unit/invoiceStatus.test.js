const { computeInvoiceStatus } = require("../../utils/invoiceStatus");

describe("computeInvoiceStatus", () => {
	test("marks PAID when the payment covers the full remaining balance", () => {
		const invoice = { amount: 45000, amountPaid: 0, status: "PENDING" };
		const result = computeInvoiceStatus(invoice, 45000);
		expect(result).toEqual({
			newAmountPaid: 45000,
			newBalance: 0,
			newStatus: "PAID",
		});
	});

	test("marks PARTIAL when only some of the balance is paid", () => {
		const invoice = { amount: 45000, amountPaid: 0, status: "PENDING" };
		const result = computeInvoiceStatus(invoice, 20000);
		expect(result).toEqual({
			newAmountPaid: 20000,
			newBalance: 25000,
			newStatus: "PARTIAL",
		});
	});

	test("accumulates on top of a prior partial payment", () => {
		const invoice = { amount: 45000, amountPaid: 20000, status: "PARTIAL" };
		const result = computeInvoiceStatus(invoice, 25000);
		expect(result).toEqual({
			newAmountPaid: 45000,
			newBalance: 0,
			newStatus: "PAID",
		});
	});

	test("never returns a negative balance on overpayment", () => {
		const invoice = { amount: 45000, amountPaid: 0, status: "PENDING" };
		const result = computeInvoiceStatus(invoice, 50000);
		expect(result.newBalance).toBe(0);
		expect(result.newStatus).toBe("PAID");
	});

	test("keeps existing status when nothing has been paid yet", () => {
		const invoice = { amount: 45000, amountPaid: 0, status: "PENDING" };
		const result = computeInvoiceStatus(invoice, 0);
		expect(result.newStatus).toBe("PENDING");
	});
});
