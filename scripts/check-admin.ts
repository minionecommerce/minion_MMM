import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
