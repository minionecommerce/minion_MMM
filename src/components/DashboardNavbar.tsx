import Link from 'next/link';

export default function DashboardNavbar() {
  return (
    <nav className="w-full bg-[#1A1A1A] border-b border-gray-800 p-4">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="text-xl font-bold text-white hover:text-yellow-500 transition-colors">
            Minion Dashboard
          </Link>
          <div className="hidden md:flex space-x-4">
            <Link href="/projects" className="text-gray-300 hover:text-white transition-colors">Projects</Link>
            <Link href="/tasks" className="text-gray-300 hover:text-white transition-colors">Tasks</Link>
            <Link href="/team" className="text-gray-300 hover:text-white transition-colors">Team</Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-sm bg-yellow-500 text-black px-4 py-2 rounded-md font-medium hover:bg-yellow-400 transition-colors">
            New Item
          </button>
        </div>
      </div>
    </nav>
  );
}
