// The office hours and the weekly off, read from the database each time they are needed (so a change takes effect at once).
// Row "schedule" of AttendanceSetting: {"start":"09:00","end":"18:30","weeklyOff":[0]}. No row, or an unusable one: 9:00 AM - 6:30 PM, Sunday off.

import { prisma } from "@/lib/db";
import { DEFAULT_SCHEDULE, parseSchedule } from "./calc";
import type { Schedule } from "./types";

export async function loadSchedule(): Promise<Schedule> {
  const row = await prisma.attendanceSetting.findUnique({ where: { key: "schedule" }, select: { value: true } });
  return parseSchedule(row?.value) ?? DEFAULT_SCHEDULE;
}
