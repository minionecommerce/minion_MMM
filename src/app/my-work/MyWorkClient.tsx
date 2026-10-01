'use client';

import { useState } from 'react';

import MyWorkHeader from './components/MyWorkHeader';
import WorkSummaryCards from './components/WorkSummaryCards';
import TodaysWork from './components/TodaysWork';
import FocusToday from './components/FocusToday';
import MyProjects from './components/MyProjects';
import TodaysSchedule from './components/TodaysSchedule';
import CustomerFollowUps from './components/CustomerFollowUps';
import ActionRequired from './components/ActionRequired';
import RecentActivity from './components/RecentActivity';
import MyPerformance from './components/MyPerformance';
import MyAchievements from './components/MyAchievements';
import QuickActions from './components/QuickActions';
import TaskDetailDrawer from './components/TaskDetailDrawer';
import CreateTaskModal from './components/CreateTaskModal';
import { WorkTask } from './data/mock';
import { MyWorkProvider } from './MyWorkContext';
import { createFollowUp } from './actions';

export default function MyWorkClient({ initialData }: { initialData: any }) {
  const [selectedTask, setSelectedTask] = useState<WorkTask | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateFollowup, setShowCreateFollowup] = useState(false);
  
  // Follow-up form state
  const [fuCustomerName, setFuCustomerName] = useState('');
  const [fuProjectType, setFuProjectType] = useState('');
  const [fuDate, setFuDate] = useState('');
  const [fuTime, setFuTime] = useState('');
  const [fuNote, setFuNote] = useState('');
  const [fuSubmitting, setFuSubmitting] = useState(false);

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuCustomerName.trim()) return;
    setFuSubmitting(true);
    
    const formData = new FormData();
    formData.append("customerName", fuCustomerName);
    formData.append("projectType", fuProjectType);
    formData.append("followUpDate", fuDate);
    formData.append("time", fuTime);
    formData.append("note", fuNote);

    await createFollowUp(formData);
    
    setFuSubmitting(false);
    setShowCreateFollowup(false);
    setFuCustomerName('');
    setFuProjectType('');
    setFuDate('');
    setFuTime('');
    setFuNote('');
  };

  return (
    <MyWorkProvider initialData={initialData}>
      <div className="w-full min-h-screen bg-[#0D0D0F] text-white font-sans selection:bg-yellow-400 selection:text-black flex flex-col">
      {/* ---- GLOBAL NAVIGATION ---- */}
      

      {/* ---- PAGE CONTENT ---- */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto">

        {/* Page Header */}
        <MyWorkHeader
          onAddTask={() => setShowCreateTask(true)}
          onAddFollowup={() => setShowCreateFollowup(true)}
        />

        {/* Summary Cards Row */}
        <WorkSummaryCards />

        {/* ---- MAIN DASHBOARD GRID ---- */}
        <div className="px-6 pb-8">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">

            {/* ============ LEFT COLUMN ============ */}
            <div className="space-y-5">

              {/* Today's Work + Focus Today */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
                <TodaysWork onTaskClick={setSelectedTask} />
                <div className="flex flex-col gap-5">
                  <FocusToday />
                  <ActionRequired />
                </div>
              </div>

              {/* My Projects */}
              <MyProjects />

              {/* Customer Follow-ups */}
              <CustomerFollowUps />

            </div>

            {/* ============ RIGHT COLUMN ============ */}
            <div className="space-y-5">
              <TodaysSchedule />
              <RecentActivity />
              <MyPerformance />
              <MyAchievements />
              <QuickActions />
            </div>

          </div>
        </div>
      </main>

      {/* ---- TASK DETAIL DRAWER ---- */}
      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* ---- CREATE TASK MODAL ---- */}
      {showCreateTask && (
        <CreateTaskModal onClose={() => setShowCreateTask(false)} />
      )}

      {/* ---- CREATE FOLLOW-UP MODAL (simplified) ---- */}
      {showCreateFollowup && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={() => setShowCreateFollowup(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#151619] border border-[#292B30] rounded-2xl w-full max-w-[480px] shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#292B30] bg-[#111113]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 rounded-full bg-yellow-400" />
                  <h2 className="text-[15px] font-bold text-white uppercase tracking-wide">Add Follow-up</h2>
                </div>
                <button
                  onClick={() => setShowCreateFollowup(false)}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <span className="text-xl leading-none">&times;</span>
                </button>
              </div>
              <form onSubmit={handleFollowUpSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Customer Name</label>
                  <input type="text" required value={fuCustomerName} onChange={e => setFuCustomerName(e.target.value)} placeholder="Enter customer name..." className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-gray-700 focus:outline-none focus:border-yellow-400/50 transition-colors" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Project Type</label>
                  <input type="text" value={fuProjectType} onChange={e => setFuProjectType(e.target.value)} placeholder="e.g. Smart Home Automation..." className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-gray-700 focus:outline-none focus:border-yellow-400/50 transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Follow-up Date</label>
                    <input type="date" value={fuDate} onChange={e => setFuDate(e.target.value)} className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-yellow-400/50 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Time</label>
                    <input type="time" value={fuTime} onChange={e => setFuTime(e.target.value)} className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-yellow-400/50 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Note</label>
                  <textarea rows={2} value={fuNote} onChange={e => setFuNote(e.target.value)} placeholder="Follow-up notes..." className="w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-gray-700 focus:outline-none focus:border-yellow-400/50 transition-colors resize-none" />
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button type="button" onClick={() => setShowCreateFollowup(false)} className="px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-[#1a1b1e] border border-[#292B30] text-gray-300 hover:text-white hover:border-gray-500 transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={!fuCustomerName.trim() || fuSubmitting} className="flex-1 py-2.5 rounded-lg text-[13px] font-bold bg-yellow-400 hover:bg-yellow-300 text-black transition-all active:scale-95 disabled:opacity-50">
                    {fuSubmitting ? 'Saving...' : 'Add Follow-up'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
    </MyWorkProvider>
  );
}
