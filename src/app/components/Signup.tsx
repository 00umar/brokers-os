import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { supabase } from '../../lib/supabase'

export default function Signup() {
  const navigate = useNavigate()
  const [companyName, setCompanyName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function makeSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50)
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (authError || !authData.user) {
      setError(authError?.message ?? 'Could not create account.')
      setLoading(false)
      return
    }

    // 2. Create company
    const slug = makeSlug(companyName)
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({ name: companyName, slug })
      .select()
      .single()

    if (companyError || !company) {
      setError(companyError?.message ?? 'Could not create workspace.')
      setLoading(false)
      return
    }

    // 3. Link profile to company as admin
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ company_id: company.id, role: 'admin', full_name: fullName })
      .eq('id', authData.user.id)

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    navigate('/app')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4">
            <span className="text-white font-bold text-xl">B</span>
          </Link>
          <h1 className="text-white text-2xl font-semibold">Create your workspace</h1>
          <p className="text-gray-400 text-sm mt-1">Free for 30 days · No credit card needed</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Company name</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              required
              placeholder="Acme Realty"
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Your full name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              placeholder="John Adeyemi"
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Work email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@yourcompany.com"
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Min. 8 characters"
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
            {loading ? 'Creating workspace…' : 'Create workspace'}
          </button>

          <p className="text-center text-gray-600 text-xs">
            By signing up you agree to our terms of service and privacy policy.
          </p>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Already have a workspace?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
