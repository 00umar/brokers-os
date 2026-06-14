import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/database.types'

const INACTIVITY_MS = 30 * 60 * 1000  // 30 minutes
const WARNING_MS   =  2 * 60 * 1000   // warn 2 min before logout

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  showInactivityWarning: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  resetInactivityTimer: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)

  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetTimerRef   = useRef<() => void>(() => {})

  async function signOut() {
    await supabase.auth.signOut()
  }

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    if (warningTimer.current)    clearTimeout(warningTimer.current)
    setShowInactivityWarning(false)
    warningTimer.current    = setTimeout(() => setShowInactivityWarning(true), INACTIVITY_MS - WARNING_MS)
    inactivityTimer.current = setTimeout(() => signOut(), INACTIVITY_MS)
  }, [])

  resetTimerRef.current = resetInactivityTimer

  // Start / stop inactivity tracking based on login state
  useEffect(() => {
    if (!user) {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      if (warningTimer.current)    clearTimeout(warningTimer.current)
      setShowInactivityWarning(false)
      return
    }
    const handler = () => resetTimerRef.current()
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const
    events.forEach(e => window.addEventListener(e, handler, { passive: true }))
    resetTimerRef.current()
    return () => {
      events.forEach(e => window.removeEventListener(e, handler))
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      if (warningTimer.current)    clearTimeout(warningTimer.current)
    }
  }, [user])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function refreshProfile() {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return
    const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single()
    setProfile(data)
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, showInactivityWarning, signIn, signOut, refreshProfile, resetInactivityTimer }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
