import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuthRoute } from "@/lib/api";
import { createDepartmentOption, listDepartmentOptions } from "@/lib/users/departments";

// GET /api/users/layout/departments — the Department pick list with the number of people in each (Super Admin)
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => NextResponse.json({ departments: await listDepartmentOptions(ctx) }));
}

const createSchema = z.object({ name: z.string().max(300) }).strict();

// POST /api/users/layout/departments — add a department (Super Admin)
export async function POST(request: Request) {
  return withAuthRoute(request, async ctx => {
    const { name } = await readJson(request, createSchema);
    return NextResponse.json({ department: await createDepartmentOption(ctx, name) }, { status: 201 });
  });
}
