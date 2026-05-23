import { Clock, Ban, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  status: string;
}

export function PendingApproval({ status }: Props) {
  const { signOut, profile } = useAuth();
  const isSuspended = status === 'suspended';

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-neutral-200 max-w-md w-full p-10 text-center shadow-sm">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
          isSuspended ? 'bg-red-50' : 'bg-orange-50'
        }`}>
          {isSuspended
            ? <Ban className="w-8 h-8 text-red-500" />
            : <Clock className="w-8 h-8 text-orange-500" />
          }
        </div>

        <h1 className="text-xl font-semibold text-neutral-900 mb-2">
          {isSuspended ? 'Account Suspended' : 'Awaiting Approval'}
        </h1>

        <p className="text-sm text-neutral-500 mb-2 leading-relaxed">
          {isSuspended
            ? 'Your account has been suspended. Please contact your administrator to restore access.'
            : 'Your account is pending administrator approval. An admin needs to activate your account before you can access the CRM.'
          }
        </p>

        {profile?.email && (
          <p className="text-xs text-neutral-400 mb-8">Signed in as {profile.email}</p>
        )}

        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
