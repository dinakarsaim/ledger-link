import { Router } from "express";
import prisma from "../prisma";
import requireAuth from "../middleware/requireAuth";

const router = Router();

/**
 * POST /api/groups
 * Create a new group
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Group name required" });

    const group = await prisma.group.create({
      data: {
        name,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
      },
      include: { members: true },
    });

    res.json({ group });
  } catch (err: any) {
    console.error("[group:create]", err);
    res.status(500).json({ error: "server error" });
  }
});

/**
 * GET /api/groups
 * List groups the current user belongs to
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const memberships = await prisma.groupMember.findMany({
      where: { userId: user.id },
      include: { group: true },
    });

    const groups = memberships.map((m) => m.group);
    res.json({ groups });
  } catch (err: any) {
    console.error("[group:list]", err);
    res.status(500).json({ error: "server error" });
  }
});

/**
 * POST /api/groups/:id/invite
 * Add a user (by email) to group
 */
router.post("/:id/invite", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { email } = req.body;

    const group = await prisma.group.findUnique({
      where: { id },
      include: { members: { include: { user: true } } },
    });

    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.ownerId !== user.id)
      return res.status(403).json({ error: "Only owner can invite" });

    const invitee = await prisma.user.findUnique({ where: { email } });
    if (!invitee) return res.status(404).json({ error: "User not found" });

    const alreadyMember = group.members.some((m) => m.userId === invitee.id);
    if (alreadyMember) return res.status(400).json({ error: "User already in group" });

    await prisma.groupMember.create({
      data: { groupId: group.id, userId: invitee.id, role: "member" },
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("[group:invite]", err);
    res.status(500).json({ error: "server error" });
  }
});

export default router;