import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function AcceptInvite() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'loading' | 'set-password' | 'done' | 'error'>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserEmail(session.user.email ?? '');
        setStep('set-password');
      } else {
        setStep('error');
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) { setError(updateError.message); return; }
    setStep('done');
    setTimeout(() => navigate('/login'), 3000);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4">
            <span className="text-white font-bold text-xl">B</span>
          </Link>
          <h1 className="text-white text-2xl font-semibold">Brokers OS</h1>
        </div>

        {step === 'loading' && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        )}

        {step === 'error' && (
          <div className="bg-red-950/40 border border-red-800 rounded-xl p-6 text-center space-y-4">
            <p className="text-red-400 text-sm">
              This invite link has expired or is invalid. Please ask your administrator to resend your invitation.
            </p>
            <Link to="/login" className="block text-blue-400 hover:text-blue-300 text-sm transition-colors">
              ← Back to sign in
            </Link>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-white rounded-xl p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900">Account activated!</h2>
            <p className="text-sm text-neutral-500">Your password has been set. Redirecting you to sign in…</p>
          </div>
        )}

        {step === 'set-password' && (
          <div className="bg-white rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Set your password</h2>
              <p className="text-sm text-neutral-500 mt-1">Welcome! Create a password for <span className="font-medium text-neutral-700">{userEmail}</span></p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder="Repeat your password"
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Activating account…' : 'Activate Account'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
