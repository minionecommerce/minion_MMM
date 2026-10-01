import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    await requirePermission("settings.manage");

    const { permissions } = await request.json(); 
    // permissions is array of { permissionId: string, effect: string, scope: string }

    const { roleId } = await params;

    await prisma.$transaction(async (tx) => {
      // 1. Delete existing permissions for role
      await tx.rolePermission.deleteMany({
        where: { roleId }
      });

      // 2. Insert new permissions
      for (const p of permissions) {
        await tx.rolePermission.create({
          data: {
            roleId,
            permissionId: p.permissionId,
            effect: p.effect || "ALLOW",
            scope: p.scope || "ALL"
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === "FORBIDDEN" || err.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
