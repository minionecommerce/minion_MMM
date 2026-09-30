import { getEmployeeById } from "@/services/team";
import EmployeeClient from "./EmployeeClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EmployeeProfilePage({ params }: { params: Promise<{ employeeId: string }> | { employeeId: string } }) {
  const resolvedParams = await params;
  const employeeId = resolvedParams?.employeeId;
  const dbEmp = employeeId ? await getEmployeeById(employeeId) : null;

  if (!dbEmp) {
    return (
      <div className="w-full min-h-screen bg-[#0D0D0F] text-white flex flex-col items-center justify-center">
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="text-[20px] font-bold mb-2">Employee Not Found</h1>
        <p className="text-[14px] text-gray-500 mb-6">The requested employee profile does not exist.</p>
        <Link href="/team" className="px-6 py-2 bg-[#151619] border border-[#292B30] hover:border-yellow-400/50 rounded-lg text-[12px] font-bold text-yellow-400 transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Team
        </Link>
      </div>
    );
  }

  const tasksAssigned = dbEmp.tasksAssigned || [];
  const completedTasks = tasksAssigned.filter((t: any) => t.status === 'Completed' || t.status === 'Verified' || t.status === 'Closed').length;
  const totalTasks = tasksAssigned.length;
  const overallPerformance = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 85;

  const employee = {
    id: dbEmp.id,
    userId: dbEmp.user?.id,
    employeeCode: `EMP-${dbEmp.id.substring(dbEmp.id.length - 4).toUpperCase()}`,
    fullName: dbEmp.user?.name || 'Staff Member',
    email: dbEmp.user?.email || 'N/A',
    role: dbEmp.user?.role?.name || 'N/A',
    accountStatus: dbEmp.user?.role?.isActive ? 'ACTIVE' : 'INACTIVE',
    phone: dbEmp.contactNumber || 'N/A',
    designation: dbEmp.designation || 'Executive Staff',
    department: dbEmp.departmentRef?.name || dbEmp.department || 'General Operations',
    reportingManager: dbEmp.manager?.user?.name || 'Executive',
    location: 'Chennai HQ',
    employmentType: 'Full-time',
    status: 'Active',
    joiningDate: dbEmp.joiningDate ? new Date(dbEmp.joiningDate).toISOString().split('T')[0] : 'N/A',
    skills: [{ name: 'Project Execution', level: 'Expert', experienceYears: 3 }],
    projectsAssigned: dbEmp.projectsManaged?.length || 0,
    tasksActive: tasksAssigned.length,
    reportingManagerId: dbEmp.managerId,
    reportingManagerName: dbEmp.manager?.user?.name || 'Executive',
    workLocation: 'Chennai HQ',
    projects: dbEmp.projectsManaged || [],
    pastProjects: [],
    team: dbEmp.subordinates || [],
    avatarUrl: undefined,
    performance: {
      taskCompletion: overallPerformance,
      onTime: overallPerformance,
      projectDelivery: overallPerformance,
      customerFollowUp: overallPerformance,
      learning: 90,
      meetingParticipation: 95,
      overall: overallPerformance
    },
    learning: dbEmp.enrollments || [],
    workload: {
      openTasks: tasksAssigned.filter((t: any) => t.status !== 'Completed' && t.status !== 'Closed').length,
      dueToday: 0,
      overdue: 0,
      inProgress: tasksAssigned.filter((t: any) => t.status === 'In Progress').length,
      completed: completedTasks,
      workloadPercentage: totalTasks > 0 ? Math.min(100, totalTasks * 20) : 10,
      status: totalTasks > 5 ? 'HIGH' : 'OPTIMAL'
    },
    tasks: tasksAssigned,
    activities: dbEmp.activities || [],
    rewards: dbEmp.rewards || []
  };

  return <EmployeeClient employee={JSON.parse(JSON.stringify(employee))} />;
}

