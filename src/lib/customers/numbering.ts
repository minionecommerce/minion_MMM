// The customer number: CUS-00001 ... one atomic counter ("Counter" row "customer"), taken inside the transaction that saves the customer.
// Small on purpose: the Leads service uses it too (a customer made from a lead gets a number as well).

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ServiceError } from "@/lib/users/service";
import { CUSTOMER_COUNTER, formatCustomerCode } from "./constants";

type Db = Prisma.TransactionClient | typeof prisma;

async function takeNumber(db: Db): Promise<number> {
  const rows = await db.$queryRaw<{ value: number }[]>`
    INSERT INTO "Counter" ("key", "value", "updatedAt") VALUES (${CUSTOMER_COUNTER}, 1, now())
    ON CONFLICT ("key") DO UPDATE SET "value" = "Counter"."value" + 1, "updatedAt" = now()
    RETURNING "value"`;
  return Number(rows[0].value);
}

// What the next customer will be called (shown in the form; the real number is taken when the customer is saved)
export async function peekNextCustomerCode(): Promise<string> {
  const row = await prisma.counter.findUnique({ where: { key: CUSTOMER_COUNTER }, select: { value: true } });
  return formatCustomerCode((row?.value ?? 0) + 1);
}

// A number that no customer has yet (a customer imported or typed with a number of this series is skipped, never duplicated)
export async function nextCustomerCode(db: Db): Promise<string> {
  for (let i = 0; i < 25; i++) {
    const code = formatCustomerCode(await takeNumber(db));
    if (!(await db.customer.findFirst({ where: { customerCode: code }, select: { id: true } }))) return code;
  }
  throw new ServiceError(500, "Could not find a free customer number. Please try again.");
}
