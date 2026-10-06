// A share link that was switched off, has expired, or never existed
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-[420px] text-center bg-white rounded-[8px] border border-[#ebeaf2] px-8 py-10 shadow-sm">
        <h1 className="text-[18px] font-semibold text-[#22263b]">This quote link is not available</h1>
        <p className="mt-2 text-[14px] text-[#575a6f]">The link may have expired or been switched off. Please ask the sender for a new one.</p>
      </div>
    </div>
  );
}
