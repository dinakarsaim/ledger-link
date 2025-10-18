import { Router } from "express";
import requireAuth from "../middleware/requireAuth";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

export default router;