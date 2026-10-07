'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { LayoutSection } from '@/lib/records/types';
import CreateTaskModal from '@/app/tasks/components/CreateTaskModal';
import { useToast } from '@/components/ui/Toast';
import { buildColumns, primaryButton, Section, SectionTable, useProject } from './common';

// TASK: the tasks of this project. They are the Tasks page's own tasks (type Project Task, linked to this project): one made here is on the Tasks
// page, and one made there for this project is here. A person sees the same ones on both pages (their own, and their team's for a manager).
export default function TasksSection({ section }: { section: LayoutSection }) {
  const { detail, layout, reload, taskOptions, userName } = useProject();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  if (!detail.tasks) return null;
  const columns = buildColumns(layout, section.id);

  return (
    <Section
      id={section.id}
      title={section.label}
      actions={detail.abilities.tasksCreate && taskOptions && <button type="button" onClick={() => setAdding(true)} className={primaryButton}><Plus className="w-4 h-4" />Add Task</button>}
    >
      <SectionTable
        columns={columns}
        rows={detail.tasks}
        empty="No task has been added to this project yet."
        cell={(f, row, i) => {
          switch (f.key) {
            case 'tkNo': return <span className="block text-center">{i + 1}</span>;
            case 'tkName': return <span className="break-words font-medium">{String(row.calc.tkName)}{row.meta.status ? <span className="ml-2 px-1.5 py-0.5 rounded bg-gray-100 text-[11px] text-gray-600 font-normal">{String(row.meta.status)}</span> : null}</span>;
            case 'tkAssignedAt': case 'tkCompletedAt': return <span className="whitespace-nowrap">{String(row.calc[f.key]) || <span className="text-gray-300">—</span>}</span>;
            default: return <span>{String(row.calc[f.key]) || <span className="text-gray-300">—</span>}</span>;
          }
        }}
      />
      {adding && taskOptions && (
        <CreateTaskModal
          mode="create"
          task={null}
          options={taskOptions}
          currentUserName={userName}
          defaultType="project"
          fixedLink={{ type: 'project', id: detail.id, label: `${detail.code} · ${String(detail.values.name ?? '')}` }}
          onClose={() => setAdding(false)}
          onSaved={message => { setAdding(false); toast.success(message); void reload(); }}
        />
      )}
    </Section>
  );
}
