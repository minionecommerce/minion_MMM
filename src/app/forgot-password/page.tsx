import Link from 'next/link';
import { KeyRound } from 'lucide-react';

// Self-service email reset needs an email provider; until then admins reset passwords.
export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 text-neutral-200">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto"><KeyRound className="w-6 h-6 text-yellow-500" /></div>
        <h1 className="text-xl font-bold text-white">Forgot your password?</h1>
        <p className="text-sm text-neutral-400">
          Please contact your CRM administrator. They can issue you a temporary password, and you will be asked to choose a new one when you sign in.
        </p>
        <Link href="/login" className="inline-block mt-2 px-5 py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-medium">Back to sign in</Link>
      </div>
    </div>
  );
}
