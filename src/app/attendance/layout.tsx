import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Attendance | Minion' };

// Attendance is a light page (white cards, yellow accent) beside the dark sidebar.
// The global light-theme remaps skip everything inside data-light-native, so the colours below are the ones that show.
export default function AttendanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-light-native
      className="min-h-screen bg-[#F5F6F8] text-[#111827]"
      style={{ fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif' }}
    >
      {children}
    </div>
  );
}
