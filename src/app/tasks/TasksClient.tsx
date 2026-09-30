'use client';

import { useState, useMemo } from 'react';

import TasksHeader from './components/TasksHeader';
import TaskSummaryCards from './components/TaskSummaryCards';
import TaskTabs from './components/TaskTabs';
import TaskFilters from './components/TaskFilters';
import TaskTable from './components/TaskTable';
import TaskDetailDrawer from './components/TaskDetailDrawer';
import CreateTaskModal from './components/CreateTaskModal';
import BulkAssignModal from './components/BulkAssignModal';
import { Task } from './data/mock';

interface TasksClientProps {
  initialTasks: any[];
  employees?: any[];
  projects?: any[];
  landscapes?: any[];
}

export default function TasksClient({
  initialTasks,
  employees = [],
  projects = [],
  landscapes = []
}: TasksClientProps) {
  const [activeTab, setActiveTab] = useState('All Tasks');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearch('');
  };

  const handleCardClick = (title: string) => {
    if (title === 'MY TASKS') {
      setActiveTab('My Tasks');
    } else if (title === 'ALL TASKS') {
      setActiveTab('All Tasks');
      setFilters({});
    } else if (title === 'IN PROGRESS') {
      setActiveTab('All Tasks');
      setFilters(prev => ({ ...prev, status: 'In Progress' }));
    } else if (title === 'OVERDUE') {
      setActiveTab('All Tasks');
      setFilters(prev => ({ ...prev, status: 'Blocked' }));
    } else if (title === 'COMPLETED') {
      setActiveTab('Completed');
    }
  };

  const exportCSV = () => {
    if (initialTasks.length === 0) return alert('No tasks to export');
    const headers = ['Task ID', 'Title', 'Project', 'Customer', 'Assigned To', 'Priority', 'Status', 'Due Date', 'Created Date'];
    const rows = filteredTasks.map(t => [
      t.id,
      `"${(t.name || '').replace(/"/g, '""')}"`,
      `"${(t.projectName || '').replace(/"/g, '""')}"`,
      `"${(t.customerName || '').replace(/"/g, '""')}"`,
      `"${(t.assignedTo || '').replace(/"/g, '""')}"`,
      t.priority,
      t.status,
      t.dueDate,
      t.createdDate
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `minion_tasks_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mappedTasks = useMemo(() => {
    return initialTasks.map(dbTask => {
      const isCompleted = dbTask.status === 'Completed' || dbTask.status === 'Verified' || dbTask.status === 'Closed';
      
      const checklists = (dbTask.checklists || []).map((c: any) => ({
        id: c.id,
        text: c.content,
        completed: c.isCompleted
      }));

      const checklistCompleted = checklists.filter((c: any) => c.completed).length;
      const checklistTotal = checklists.length;
      
      // Calculate progress based on checklists if they exist, otherwise based on status
      let progress = isCompleted ? 100 : (dbTask.status === 'In Progress' ? 50 : 0);
      if (checklistTotal > 0) {
        progress = Math.round((checklistCompleted / checklistTotal) * 100);
      }

      const collaborators = [];
      if (dbTask.secondaryAssignee) {
        collaborators.push(dbTask.secondaryAssignee.user?.name || dbTask.secondaryAssignee.designation);
      }

      return {
        id: dbTask.id,
        name: dbTask.title,
        projectId: dbTask.projectId || '',
        projectName: dbTask.project?.name || (dbTask.landscape?.name ? `Park: ${dbTask.landscape.name}` : 'Internal'),
        customerId: dbTask.project?.customerId || dbTask.customerId || '',
        customerName: dbTask.project?.customer?.name || '-',
        priority: dbTask.priority || 'Medium',
        status: dbTask.status || 'Not Started',
        dueDate: dbTask.dueDate ? new Date(dbTask.dueDate).toISOString().split('T')[0] : 'N/A',
        startDate: dbTask.startDate ? new Date(dbTask.startDate).toISOString().split('T')[0] : undefined,
        assignedTo: dbTask.assignee?.user?.name || dbTask.assignee?.designation || 'Unassigned',
        assignedBy: dbTask.assignedBy?.user?.name || 'System',
        type: 'Execution' as any,
        progress,
        alerts: [],
        description: dbTask.description || '',
        source: 'Internal' as any,
        collaborators,
        watchers: [],
        milestoneId: undefined,
        completionDate: dbTask.completedAt ? new Date(dbTask.completedAt).toISOString().split('T')[0] : undefined,
        notes: dbTask.completionNotes || undefined,
        attachments: [], // TBD link resources
        checklist: checklists,
        requiresCompletionProof: dbTask.requiresCompletionProof,
        requiresVerification: dbTask.requiresVerification,
        isRecurringInstance: dbTask.isRecurringInstance,
        createdDate: dbTask.createdAt ? new Date(dbTask.createdAt).toISOString().split('T')[0] : 'N/A',
        comments: (dbTask.comments || []).map((c: any) => ({
          id: c.id,
          user: c.author?.user?.name || 'User',
          text: c.content,
          timestamp: new Date(c.createdAt).toLocaleString()
        })),
        activities: (dbTask.auditLogs || []).map((a: any) => ({
          id: a.id,
          action: a.action,
          user: a.employee?.user?.name || 'System',
          date: new Date(a.createdAt).toLocaleString(),
          details: `${a.oldValue ? `From ${a.oldValue} ` : ''}${a.newValue ? `To ${a.newValue}` : ''}`
        }))
      };
    });
  }, [initialTasks]);

  const filteredTasks = useMemo(() => {
    return mappedTasks.filter(task => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        if (
          !task.name.toLowerCase().includes(q) &&
          !task.id.toLowerCase().includes(q) &&
          !task.projectName?.toLowerCase().includes(q) &&
          !task.customerName?.toLowerCase().includes(q) &&
          !task.assignedTo.toLowerCase().includes(q)
        ) return false;
      }

      // Advanced filters
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.status && task.status !== filters.status) return false;

      // Active Main Tab Logic
      if (activeTab === 'Completed' && task.status !== 'Completed' && task.status !== 'Closed' && task.status !== 'Verified') {
        return false;
      }

      return true;
    });
  }, [mappedTasks, search, filters, activeTab]);

  return (
    <div className="w-full min-h-screen bg-[#0D0D0F] text-white font-sans selection:bg-yellow-400 selection:text-black flex flex-col relative overflow-x-hidden">
      
      <main className="flex-1 w-full max-w-[1700px] mx-auto">
        <TasksHeader 
          onNewTask={() => setShowCreateModal(true)}
          onBulkAssign={() => setShowBulkAssignModal(true)}
          onCreateTaskList={() => setShowCreateModal(true)}
          onExport={exportCSV}
          onFilter={() => {
            const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
            if (searchInput) searchInput.focus();
          }}
        />
        
        {(activeTab === 'My Tasks' || activeTab === 'All Tasks') && (
          <TaskSummaryCards 
            tasks={mappedTasks}
            onCardClick={handleCardClick}
          />
        )}

        <TaskTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="px-6 py-8">
          <TaskFilters 
            search={search}
            onSearchChange={setSearch}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
          
          <div className="mt-6">
            <TaskTable 
              tasks={filteredTasks} 
              onTaskClick={setSelectedTask} 
            />
          </div>
        </div>
      </main>

      <TaskDetailDrawer 
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />

      {showCreateModal && (
        <CreateTaskModal
          employees={employees}
          projects={projects}
          landscapes={landscapes}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showBulkAssignModal && (
        <BulkAssignModal
          tasks={mappedTasks}
          employees={employees}
          onClose={() => setShowBulkAssignModal(false)}
        />
      )}
    </div>
  );
}

