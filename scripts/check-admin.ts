import { createPrismaClient } from "../src/lib/prisma-factory";
import bcrypt from "bcryptjs";

const prisma = createPrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "admin@minion.com" }
  });
  
  if (!user) {
    console.log("Admin user not found.");
  } else {
    console.log("Admin user found:", user.email);
    const valid = await bcrypt.compare("admin123", user.password || "");
    console.log("Is 'admin123' valid?:", valid);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
