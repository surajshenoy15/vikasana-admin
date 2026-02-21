import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AuthContext = createContext(null)

const API_URL = 'http://31.97.230.171:8000'
const API_PREFIX = '/api'

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null)
  const [bootstrapping, setBootstrapping] = useState(true)

  // ✅ Fixed: handles JSON vs FormData correctly and always attaches token
  const authFetch = useCallback((path, options = {}) => {
    const token = sessionStorage.getItem('vf_token')

    const headers = {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    // Only set JSON content-type if body is present AND it's not FormData
    const isFormData = options.body instanceof FormData
    if (options.body && !isFormData) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json'
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`

    return fetch(`${API_URL}${API_PREFIX}${normalizedPath}`, {
      ...options,
      headers,
    })
  }, [])

  // Restore session on refresh
  useEffect(() => {
    const token = sessionStorage.getItem('vf_token')
    if (!token) {
      setBootstrapping(false)
      return
    }

    ;(async () => {
      try {
        const res = await authFetch('/auth/me', { method: 'GET' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          sessionStorage.removeItem('vf_token')
          setAdmin(null)
        } else {
          setAdmin(data)
        }
      } catch {
        setAdmin(null)
      } finally {
        setBootstrapping(false)
      }
    })()
  }, [authFetch])

  const login = useCallback(async ({ email, password }) => {
    try {
      const res = await fetch(`${API_URL}${API_PREFIX}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        return { success: false, message: data.detail ?? 'Login failed. Please try again.' }
      }

      if (!data.access_token) {
        return { success: false, message: 'No access token received from server.' }
      }

      sessionStorage.setItem('vf_token', data.access_token)

      // get admin profile
      const meRes = await fetch(`${API_URL}${API_PREFIX}/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
      const me = await meRes.json().catch(() => ({}))

      if (!meRes.ok) {
        sessionStorage.removeItem('vf_token')
        return { success: false, message: me.detail ?? 'Unable to fetch admin profile.' }
      }

      setAdmin(me)
      return { success: true }
    } catch {
      return { success: false, message: 'Cannot reach server. Check your connection.' }
    }
  }, [])

  const logout = useCallback(async () => {
    const token = sessionStorage.getItem('vf_token')
    if (token) {
      fetch(`${API_URL}${API_PREFIX}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }

    sessionStorage.removeItem('vf_token')
    setAdmin(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        admin,
        login,
        logout,
        authFetch,
        isAuthenticated: !!admin,
        bootstrapping,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}