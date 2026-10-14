import { useCallback, useMemo, useState } from 'react'
import { AuthContext } from './authContext.js'
import { getCurrentUser, logIn, logOut, signUp } from './authClient.js'
export function AuthProvider({ children }) { const [user, setUser] = useState(getCurrentUser); const logout = useCallback(() => { logOut(); setUser(null) }, []); const value = useMemo(() => ({ user, status: user ? 'authenticated' : 'anonymous', displayName: user?.username || 'User', signUp: (data) => { const next = signUp(data); setUser(next); return next }, logIn: (data) => { const next = logIn(data); setUser(next); return next }, logout }), [user, logout]); return <AuthContext.Provider value={value}>{children}</AuthContext.Provider> }
