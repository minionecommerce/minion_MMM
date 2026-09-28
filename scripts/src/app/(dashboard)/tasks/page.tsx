import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function TasksPage() {
  // DB Connection Example for Tasks
  // const session = await getServerSession(authOptions);
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Tasks Dashboard</h1>
      <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-8">
        <p className="text-gray-400">
          This is the dynamic Tasks module. Content will be connected to the PostgreSQL database here.
        </p>
      </div>
    </div>
  );
}
