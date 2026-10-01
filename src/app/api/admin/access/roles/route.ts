import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Only highly authorized admins
    await requirePermission("settings.manage");

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    const existingRole = await prisma.role.findUnique({
      where: { name }
    });

    if (existingRole) {
      return NextResponse.json({ error: "Role name already exists" }, { status: 400 });
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        isActive: true,
      }
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
