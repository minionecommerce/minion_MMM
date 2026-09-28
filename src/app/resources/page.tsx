import DashboardNavbar from '@/components/DashboardNavbar';

export default function ResourcesPage() {
  return (
    <div className="w-full min-h-screen font-sans selection:bg-yellow-500 selection:text-black flex flex-col">
      <div className="bg-[#111111] text-white w-full flex-1 flex flex-col">
        <DashboardNavbar />
        <main className="w-full max-w-[1600px] mx-auto p-10 flex-1">
          <h1 className="text-4xl font-bold text-white mb-6">Resources</h1>
          <p className="text-gray-400">Content for Resources goes here.</p>
        </main>
      </div>
    </div>
  );
}
