'use client';

import { useState, useMemo } from 'react';

import TeamHeader from './components/TeamHeader';
import TeamSummaryCards from './components/TeamSummaryCards';
import TeamTabs from './components/TeamTabs';
import TeamFilters from './components/TeamFilters';
import PeopleDirectory from './components/PeopleDirectory';
import OrganizationChart from './components/OrganizationChart';
import DepartmentCards from './components/DepartmentCards';
import AddEmployeeModal from './components/AddEmployeeModal';
import DepartmentModal from './components/DepartmentModal';
import AssignTeamModal from './components/AssignTeamModal';
import Link from 'next/link';

interface TeamClientProps {
  initialEmployees: any[];
  departments?: any[];
  projects?: any[];
  roles?: any[];
  allPermissions?: any[];
}

export default function TeamClient({
  initialEmployees = [],
  departments = [],
  projects = [],
  roles = [],
  allPermissions = []
}: TeamClientProps) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showAssignTeamModal, setShowAssignTeamModal] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearch('');
  };

  const handleCardClick = (title: string) => {
    if (title === 'TOTAL EMPLOYEES' || title === 'ACTIVE TODAY') {
      setActiveTab('People');
    } else if (title === 'ON PROJECTS') {
      setActiveTab('Projects');
    } else if (title === 'TASK WORKLOAD') {
      setActiveTab('Workload');
    } else if (title === 'LEARNING') {
      setActiveTab('Skills');
    } else if (title === 'TEAM PERFORMANCE') {
      setActiveTab('Performance');
    }
  };

  const exportCSV = () => {
    if (initialEmployees.length === 0) return alert('No employee data to export');
    const headers = ['Employee ID', 'Name', 'Designation', 'Department', 'Contact', 'Projects Managed', 'Tasks Assigned', 'Joined Date'];
    const rows = filteredEmployees.map(e => [
      e.employeeCode,
      `"${(e.fullName || '').replace(/"/g, '""')}"`,
      `"${(e.designation || '').replace(/"/g, '""')}"`,
      `"${(e.department || '').replace(/"/g, '""')}"`,
      `"${(e.phone || '').replace(/"/g, '""')}"`,
      e.projectsAssigned,
      e.tasksActive,
      e.joiningDate
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `minion_team_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mappedEmployees = useMemo(() => {
    return initialEmployees.map(dbEmp => {
      const tasksAssigned = dbEmp.tasksAssigned || [];
      const completedTasks = tasksAssigned.filter((t: any) => t.status === 'Completed' || t.status === 'Verified' || t.status === 'Closed').length;
      const totalTasks = tasksAssigned.length;
      const overallPerformance = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 85;

      return {
        id: dbEmp.id,
        employeeCode: `EMP-${dbEmp.id.substring(dbEmp.id.length - 4).toUpperCase()}`,
        fullName: dbEmp.user?.name || 'Staff Member',
        email: dbEmp.user?.email || 'N/A',
        phone: dbEmp.contactNumber || 'N/A',
        designation: dbEmp.designation || 'Executive Staff',
        department: dbEmp.departmentRef?.name || dbEmp.department || 'General Operations',
        reportingManager: dbEmp.manager?.user?.name || 'Executive',
        location: 'Chennai HQ',
        employmentType: 'Full-time' as any,
        status: 'Active' as any,
        joiningDate: dbEmp.joiningDate ? new Date(dbEmp.joiningDate).toISOString().split('T')[0] : 'N/A',
        skills: [{ name: 'Project Execution', level: 'Expert' as any, experienceYears: 3 }],
        projectsAssigned: dbEmp._count?.projectsManaged || dbEmp.projectsManaged?.length || 0,
        tasksActive: dbEmp._count?.tasksAssigned || dbEmp.tasksAssigned?.length || 0,
        reportingManagerId: dbEmp.managerId,
        reportingManagerName: dbEmp.manager?.user?.name || 'Executive',
        workLocation: 'Chennai HQ',
        projects: dbEmp.projectsManaged || [],
        pastProjects: [],
        team: [],
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
          status: (totalTasks > 5 ? 'HIGH' : 'OPTIMAL') as any
        }
      };
    });
  }, [initialEmployees]);

  const filteredEmployees = useMemo(() => {
    return mappedEmployees.filter(emp => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        if (
          !emp.fullName.toLowerCase().includes(q) &&
          !emp.employeeCode.toLowerCase().includes(q) &&
          !emp.department.toLowerCase().includes(q) &&
          !emp.designation.toLowerCase().includes(q)
        ) return false;
      }

      // Advanced filters
      if (filters.department && emp.department !== filters.department) return false;
      if (filters.status && emp.status !== filters.status) return false;

      return true;
    });
  }, [mappedEmployees, search, filters]);

  // Derived departments for cards if DB list empty
  const formattedDepartments = useMemo(() => {
    if (departments.length > 0) {
      return departments.map(d => ({
        id: d.id,
        name: d.name,
        code: d.name.substring(0, 4).toUpperCase(),
        headName: 'Department Head',
        headDesignation: 'Lead',
        employeeCount: d.employees?.length || 0,
        memberCount: d.employees?.length || 0,
        activeProjectsCount: 2,
        activeProjects: 2,
        openTasks: 5,
        completionRate: 90,
        budget: '$150,000',
        description: `Operational activities for ${d.name}`
      }));
    }

    const deptMap: Record<string, number> = {};
    initialEmployees.forEach(e => {
      const dName = e.departmentRef?.name || e.department || 'General Operations';
      deptMap[dName] = (deptMap[dName] || 0) + 1;
    });

    return Object.entries(deptMap).map(([name, count], i) => ({
      id: `dept-${i}`,
      name,
      code: name.substring(0, 4).toUpperCase(),
      headName: 'Department Head',
      headDesignation: 'Lead',
      employeeCount: count,
      memberCount: count,
      activeProjectsCount: 3,
      activeProjects: 3,
      openTasks: 8,
      completionRate: 88,
      budget: '$200,000',
      description: `Core tasks & responsibilities for ${name}`
    }));
  }, [departments, initialEmployees]);


  return (
    <div className="w-full min-h-screen bg-[#0D0D0F] text-white font-sans selection:bg-yellow-400 selection:text-black flex flex-col relative overflow-x-hidden">
      
      <main className="flex-1 w-full max-w-[1700px] mx-auto">
        <TeamHeader 
          onAddEmployee={() => setShowAddEmployeeModal(true)}
          onCreateTeam={() => setShowDepartmentModal(true)}
          onOrganization={() => setActiveTab('Organization')}
          onAssignTeam={() => setShowAssignTeamModal(true)}
          onExport={exportCSV}
          onFilter={() => {
            const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
            if (input) input.focus();
          }}
        />
        
        {(activeTab === 'Overview' || activeTab === 'People') && (
          <TeamSummaryCards 
            employees={initialEmployees}
            roles={roles}
            onCardClick={handleCardClick}
          />
        )}

        <TeamTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="px-6 py-8">
          
          {(activeTab === 'Overview' || activeTab === 'People') && (
            <div className="mb-6">
              <TeamFilters 
                search={search}
                onSearchChange={setSearch}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>
          )}

          {activeTab === 'Overview' && (
            <div className="space-y-8">
              <OrganizationChart />
              <div>
                <h2 className="text-[14px] font-bold text-white mb-4 uppercase tracking-wide">Departments ({formattedDepartments.length})</h2>
                <DepartmentCards departments={formattedDepartments} />
              </div>
              <div>
                <h2 className="text-[14px] font-bold text-white mb-4 uppercase tracking-wide">People Directory ({filteredEmployees.length})</h2>
                <PeopleDirectory employees={filteredEmployees} viewMode={viewMode} />
              </div>
            </div>
          )}

          {activeTab === 'People' && (
            <PeopleDirectory employees={filteredEmployees} viewMode={viewMode} />
          )}

          {activeTab === 'Departments' && (
            <DepartmentCards departments={formattedDepartments} />
          )}

          {activeTab === 'Organization' && (
            <OrganizationChart />
          )}

          {activeTab === 'Projects' && (
            <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6 space-y-4">
              <h3 className="text-[15px] font-bold text-white uppercase tracking-wide mb-4">Project Assignments ({projects.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map(p => (
                  <div key={p.id} className="p-4 bg-[#0D0D0F] border border-[#292B30] rounded-xl flex justify-between items-center">
                    <div>
                      <div className="text-[13px] font-bold text-white">{p.name}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">Customer: {p.customer?.name || 'Internal'}</div>
                    </div>
                    <Link href={`/projects/${p.id}`} className="px-3 py-1.5 rounded-lg bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 text-[11px] font-bold hover:bg-yellow-400 hover:text-black transition-colors">
                      View Project
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Workload' && (
            <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6">
              <h3 className="text-[15px] font-bold text-white uppercase tracking-wide mb-4">Team Task Workload</h3>
              <div className="space-y-4">
                {filteredEmployees.map(emp => (
                  <div key={emp.id} className="p-4 bg-[#0D0D0F] border border-[#292B30] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center font-bold">
                        {emp.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-white">{emp.fullName}</div>
                        <div className="text-[11px] text-gray-500">{emp.designation} • {emp.department}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-[14px] font-bold text-white">{emp.workload.openTasks}</div>
                        <div className="text-[10px] text-gray-500 font-semibold uppercase">Open Tasks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[14px] font-bold text-green-400">{emp.workload.completed}</div>
                        <div className="text-[10px] text-gray-500 font-semibold uppercase">Completed</div>
                      </div>
                      <Link href={`/team/${emp.id}`} className="px-3 py-1.5 rounded-lg bg-[#151619] border border-[#292B30] hover:border-yellow-400/50 text-[11px] font-bold text-yellow-400 transition-colors">
                        Workload Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Skills' && (
            <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6">
              <h3 className="text-[15px] font-bold text-white uppercase tracking-wide mb-4">Team Skill Matrix</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Automation & Wiring', 'Project Management', 'CAD & Landscape Design', 'Site Inspection', 'Customer Support', 'Procurement'].map(skill => (
                  <div key={skill} className="p-4 bg-[#0D0D0F] border border-[#292B30] rounded-xl">
                    <div className="text-[13px] font-bold text-white mb-1">{skill}</div>
                    <div className="text-[11px] text-gray-400">Staff assigned across {Math.min(filteredEmployees.length, 3)} active employees</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Performance' && (
            <div className="bg-[#151619] border border-[#292B30] rounded-xl p-6">
              <h3 className="text-[15px] font-bold text-white uppercase tracking-wide mb-4">Performance Scores</h3>
              <div className="space-y-4">
                {filteredEmployees.map(emp => (
                  <div key={emp.id} className="p-4 bg-[#0D0D0F] border border-[#292B30] rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-400/20 text-green-400 flex items-center justify-center font-bold">
                        {emp.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-white">{emp.fullName}</div>
                        <div className="text-[11px] text-gray-500">{emp.designation}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-[16px] font-black text-green-400">{emp.performance.overall}%</div>
                      <div className="w-24 h-2 bg-[#151619] rounded-full overflow-hidden border border-[#292B30]">
                        <div className="h-full bg-green-400 rounded-full" style={{ width: `${emp.performance.overall}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {showAddEmployeeModal && (
        <AddEmployeeModal
          departments={departments}
          managers={initialEmployees}
          roles={roles}
          allPermissions={allPermissions}
          onClose={() => setShowAddEmployeeModal(false)}
        />
      )}

      {showDepartmentModal && (
        <DepartmentModal
          onClose={() => setShowDepartmentModal(false)}
        />
      )}

      {showAssignTeamModal && (
        <AssignTeamModal
          projects={projects}
          employees={initialEmployees}
          onClose={() => setShowAssignTeamModal(false)}
        />
      )}
    </div>
  );
}

