import { createContext, useContext } from 'react'

/**
 * AuthContext — provides session, role, and instituteId to all components.
 * Use the `useAuth()` hook to access these in any page or component.
 */
export const AuthContext = createContext({
  session:     null,
  userRole:    null,
  instituteId: null,
  loading:     true,
})

export const useAuth = () => useContext(AuthContext)
