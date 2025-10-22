// backend/src/routes/expenses.ts
import { Router } from "express";
import prisma from "../prisma";
import requireAuth from "../middleware/requireAuth";

const router = Router();

/**
 * POST /api/expenses
 * Create an expense from a parsed receipt or manual payload
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { receiptId, totalAmount, currency, description, parsed, splits } = req.body;

    // 🧾 Step 1: load receipt
    const receipt = await prisma.receipt.findUnique({ where: { id: receiptId } });
    if (!receipt) return res.status(404).json({ error: "Receipt not found" });
    if (receipt.userId !== user.id) return res.status(403).json({ error: "Forbidden" });

    // 🧮 Step 2: derive total
    const total = Number(totalAmount ?? parsed?.total ?? 0);
    if (!total || total <= 0) return res.status(400).json({ error: "Invalid total amount" });

    // 🪙 Step 3: create Expense
    const expense = await prisma.expense.create({
      data: {
        payerId: user.id,
        receiptId: receiptId,
        totalAmount: total,
        currency: currency || parsed?.currency || "INR",
        description: description || parsed?.merchant || "Receipt expense",
      },
    });

    // 🧩 Step 4: create splits
    // For now, just one payer (self). You can later extend this to real group splits.
    await prisma.expenseSplit.create({
      data: {
        expenseId: expense.id,
        userId: user.id,
        amount: total,
        shareMethod: "equal",
        settled: true,
      },
    });

    // 🪄 Optional: mark receipt as "converted to expense"
    await prisma.receipt.update({
      where: { id: receiptId },
      data: { parsed },
    });

    return res.json({ expense });
  } catch (err: any) {
    console.error("[expenses] create error:", err);
    return res.status(500).json({ error: err.message || "server error" });
  }
});

/**
 * GET /api/expenses
 * List user expenses
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const expenses = await prisma.expense.findMany({
      where: { payerId: user.id },
      include: { receipt: true, splits: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ expenses });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server error" });
  }
});

export default router;