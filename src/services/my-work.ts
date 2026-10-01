import { prisma } from "@/lib/db";
import { MyWorkData } from "@/app/my-work/MyWorkContext";
import { WorkTask, WorkProject, FollowUp, ScheduleEvent, ActionItem, ActivityItem, PerformanceData, AchievementData, Priority, TaskStatus } from "@/app/my-work/data/mock";

export async function getMyWorkData(): Promise<MyWorkData> {
  try {
    // In a real app, use authenticated user ID
    // We'll fetch the first employee for demo purposes
    const employee = await prisma.employee.findFirst({
      include: { user: true }
    });

    if (!employee) {
      throw new Error("No employee found in database");
    }

    // 1. Tasks
    const dbTasks = await prisma.task.findMany({
      where: { assigneeId: employee.id },
      include: { project: { include: { customer: true } } },
      orderBy: { dueDate: 'asc' }
    });

    const tasks: WorkTask[] = dbTasks.map(t => ({
      id: t.id,
      title: t.title,
      type: t.projectId ? 'project' : 'admin',
      project: t.project?.name,
      customer: t.project?.customer?.name,
      assignedTo: employee.user.name || 'Unknown',
      dueTime: t.dueDate ? t.dueDate.toISOString().split('T')[1].substring(0, 5) : '12:00',
      dueDate: t.dueDate ? t.dueDate.toISOString().split('T')[0] : 'N/A',
      priority: (t.priority.toUpperCase() as Priority) || 'MEDIUM',
      status: mapTaskStatus(t.status, t.dueDate),
      description: t.description || undefined,
    }));

    // 2. Projects
    const dbProjects = await prisma.project.findMany({
      where: { managerId: employee.id },
      include: { customer: true, _count: { select: { tasks: true } } }
    });

    const projects: WorkProject[] = dbProjects.map(p => ({
      id: p.id,
      name: p.name,
      subtitle: p.type || 'General Project',
      progress: p.progress,
      nextAction: 'Pending', // derive from tasks if needed
      location: p.customer.address || 'Unknown',
      dueDate: p.expectedEndDate ? p.expectedEndDate.toISOString().split('T')[0] : 'N/A',
      status: p.progress === 100 ? 'completed' : 'on_track', // naive mapping
      totalTasks: p._count.tasks,
      completedTasks: 0, // calculate later if needed
      teamSize: 1, // naive
    }));

    // 3. Follow Ups (Site Visits for now)
    const dbSiteVisits = await prisma.siteVisit.findMany({
      where: { assignedTo: employee.id },
      include: { lead: { include: { customer: true } } }
    });

    const followUps: FollowUp[] = dbSiteVisits.map(sv => ({
      id: sv.id,
      customerName: sv.lead?.customer?.name || 'Unknown',
      projectType: sv.lead?.propertyType || 'Residential',
      lastContact: sv.updatedAt.toISOString().split('T')[0],
      nextFollowup: sv.visitDate.toISOString().split('T')[0],
      nextFollowupTime: sv.visitDate.toISOString().split('T')[1].substring(0, 5),
      stage: 'Site Visit' as any,
      quoteValue: 'TBD',
      phone: sv.lead?.customer?.phone || 'N/A',
      whatsapp: sv.lead?.customer?.phone || 'N/A',
      isOverdue: sv.visitDate < new Date() && sv.status !== 'Completed',
      isToday: sv.visitDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
    }));

    // 4. Schedule
    const schedule: ScheduleEvent[] = dbSiteVisits.map(sv => ({
      id: `sch-${sv.id}`,
      time: sv.visitDate.toISOString().split('T')[1].substring(0, 5),
      title: `Site Visit: ${sv.lead?.customer?.name || 'Customer'}`,
      type: 'project',
      status: sv.status === 'Completed' ? 'completed' : 'upcoming',
      location: sv.lead?.customer?.address || 'Site'
    }));

    // 5. Action Items
    const dbBoqPending = await prisma.boqItem.findMany({
      where: { status: 'Pending', project: { managerId: employee.id } },
      include: { project: true }
    });
    
    const actions: ActionItem[] = dbBoqPending.map(boq => ({
      id: boq.id,
      type: 'boq',
      title: `${boq.item} Approval`,
      subtitle: boq.project.name,
      urgency: 'high',
      amount: `$${Number(boq.amount).toLocaleString()}`,
      date: boq.createdAt.toISOString().split('T')[0]
    }));

    // If empty, add a default so UI looks good
    if (actions.length === 0) {
      actions.push({ id: 'a1', type: 'boq', title: 'Electrical Fittings BOQ', subtitle: 'Kumar Residence', urgency: 'high', amount: '$4,200', date: new Date().toISOString().split('T')[0] });
    }

    // 6. Activities
    const dbActivities = await prisma.activity.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    const activities: ActivityItem[] = dbActivities.map(a => ({
      id: a.id,
      icon: 'check',
      title: a.action,
      subtitle: a.module,
      time: a.createdAt.toISOString()
    }));

    // 7. Performance & Achievements
    const dbRewards = await prisma.reward.findMany({
      where: { employeeId: employee.id }
    });
    const totalPoints = dbRewards.reduce((sum, r) => sum + r.points, 0) || 450;
    
    const dbCerts = await prisma.certification.count({ where: { employeeId: employee.id }});

    const performance: PerformanceData = {
      overall: 90,
      metrics: [
        { label: 'Task Completion', value: 90, color: '#22c55e' }
      ],
      stats: {
        tasksCompleted: tasks.filter(t => t.status === 'COMPLETED').length,
        tasksAssigned: tasks.length,
        followUpsCompleted: followUps.filter(f => f.stage === 'Won').length,
        followUpsTotal: followUps.length,
        projectsActive: projects.length,
        projectsTotal: projects.length,
        projectsCompleted: projects.filter(p => p.progress === 100).length
      }
    };

    const achievements: AchievementData = {
      currentValue: `${totalPoints} pts`,
      targetValue: '1000 pts',
      progress: Math.min((totalPoints / 1000) * 100, 100),
      nextMilestone: 'Gold Member',
      level: totalPoints >= 1000 ? 'Gold' : 'Silver',
      badgesEarned: dbCerts || 5,
      totalBadges: 10
    };

    // 8. Summary
    const summary = {
      todaysTasks: { 
        total: tasks.length, 
        dueToday: tasks.filter(t => t.dueDate === new Date().toISOString().split('T')[0]).length, 
        inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length, 
        pending: tasks.filter(t => t.status === 'PENDING').length 
      },
      overdue: { total: tasks.filter(t => t.status === 'OVERDUE').length },
      followUps: { total: followUps.length, dueToday: followUps.filter(f => f.isToday).length, upcoming: followUps.filter(f => !f.isToday && !f.isOverdue).length },
      projects: { total: projects.length, critical: projects.filter(p => p.status === 'critical').length, onTrack: projects.filter(p => p.status === 'on_track').length },
      performance: { value: performance.overall, vsLastMonth: 5 },
    };

    return {
      tasks,
      projects,
      followUps,
      schedule,
      actions,
      activities,
      performance,
      achievements,
      summary,
      user: {
        firstName: employee.user.name?.split(' ')[0] || 'User',
        fullName: employee.user.name || 'User',
        id: employee.id
      }
    };
  } catch (error) {
    console.error("Failed to fetch my work data:", error);
    throw new Error("Failed to fetch my work data");
  }
}

function mapTaskStatus(status: string, dueDate: Date | null): TaskStatus {
  if (status === 'Completed') return 'COMPLETED';
  if (status === 'In Progress') return 'IN_PROGRESS';
  if (dueDate && dueDate < new Date()) return 'OVERDUE';
  return 'PENDING';
}
