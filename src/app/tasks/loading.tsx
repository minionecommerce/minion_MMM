import { Loader2 } from "lucide-react";

export default function TasksLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-yellow-500" />
      <h2 className="text-xl font-semibold text-gray-200">Loading Tasks...</h2>
      <p className="text-gray-400">Fetching latest data from the database.</p>
    </div>
  );
}
