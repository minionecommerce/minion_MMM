import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ roleId: string }> | { roleId: string } }) {
  try {
    await requirePermission("settings.manage");
    const resolvedParams = await params;
    const roleId = resolvedParams.roleId;
    const body = await request.json();
    const { isActive, name, description } = body;

    const dataToUpdate: any = {};
    if (typeof isActive === 'boolean') dataToUpdate.isActive = isActive;
    if (name) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description;

    const role = await prisma.role.update({
      where: { id: roleId },
      data: dataToUpdate
    });

    return NextResponse.json(role);
  } catch (err: any) {
    if (err.message === "FORBIDDEN" || err.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ roleId: string }> | { roleId: string } }) {
  try {
    await requirePermission("settings.manage");
    const resolvedParams = await params;
    const roleId = resolvedParams.roleId;

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    if (role.name === "SUPER_ADMIN") {
      return NextResponse.json({ error: "Cannot delete SUPER_ADMIN role" }, { status: 400 });
    }

    await prisma.role.delete({
      where: { id: roleId }
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
