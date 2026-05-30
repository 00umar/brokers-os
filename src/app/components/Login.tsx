import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

type Mode = 'signin' | 'forgot'

export default function Login() {
  const { signIn } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const switchMode = (newMode: Mode) => {
    setMode(newMode)
    setError(null)
    setSuccess(null)
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) setError(error)
    setLoading(false)
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSuccess('Check your email for a password reset link.')
  }

  const titles: Record<Mode, string> = {
    signin: 'Sign in to your account',
    forgot: 'Reset your password',
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4">
            <span className="text-white font-bold text-xl">7</span>
          </Link>
          <h1 className="text-white text-2xl font-semibold">765 Operations</h1>
          <p className="text-gray-400 text-sm mt-1">{titles[mode]}</p>
        </div>

        {/* Success state */}
        {success ? (
          <div className="space-y-4">
            <div className="bg-green-950/40 border border-green-800 rounded-lg px-4 py-4 text-center">
              <p className="text-green-400 text-sm leading-relaxed">{success}</p>
            </div>
            <button
              onClick={() => switchMode('signin')}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            {/* ── Sign In ── */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@765realty.com"
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm text-gray-400">Password</label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                {error && (
                  <p className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
                <p className="text-center text-gray-600 text-xs mt-2">
                  Access is by invitation only. Contact your administrator.
                </p>
              </form>
            )}

            {/* ── Forgot Password ── */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-gray-400 text-sm">Enter your email and we'll send you a link to reset your password.</p>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@765realty.com"
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                {error && (
                  <p className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
                >
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
                <p className="text-center">
                  <button type="button" onClick={() => switchMode('signin')} className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                    ← Back to sign in
                  </button>
                </p>
              </form>
            )}
          </>
        )}

        <div className="text-center mt-6">
          <Link to="/" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
