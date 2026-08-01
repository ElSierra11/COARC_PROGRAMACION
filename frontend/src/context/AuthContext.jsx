import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

const defaultProfeUser = {
  id: 0,
  username: 'coordinador_profe',
  email: 'profe@coarc.com',
  full_name: 'Coordinador Arbitral COARC',
  role: 'PROFE'
};

const superAdminUser = {
  id: 1,
  username: 'alejosierra',
  email: 'alejosierra656@gmail.com',
  full_name: 'Alejandro Sierra (Administrador)',
  role: 'ADMIN'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState(null);
  const [authNoticeReason, setAuthNoticeReason] = useState('');
  const [isLoginModalRequested, setIsLoginModalRequested] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('coarc_token') || sessionStorage.getItem('coarc_token');
      if (token) {
        if (token === 'mock_superadmin_token') {
          setUser(superAdminUser);
        } else if (token === 'mock_profe_token') {
          setUser(defaultProfeUser);
        } else {
          try {
            const userData = await authService.getMe();
            setUser(userData);
          } catch (err) {
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password, rememberMe = true) => {
    const cleanUser = username.trim().toLowerCase();
    let loggedUser = null;
    let tokenValue = '';
    
    // Credenciales directas de SuperAdmin
    if ((cleanUser === 'alejosierra656@gmail.com' || cleanUser === 'alejosierra') && password === 'Alejandro10@') {
      tokenValue = 'mock_superadmin_token';
      loggedUser = superAdminUser;
    } else if ((cleanUser === 'admin' || cleanUser === 'profe') && password === 'coarc2026') {
      // Credenciales directas de Profe
      tokenValue = 'mock_profe_token';
      loggedUser = defaultProfeUser;
    } else {
      try {
        const data = await authService.login(cleanUser, password);
        tokenValue = data.access_token;
        loggedUser = data.user;
      } catch (err) {
        throw err;
      }
    }

    if (tokenValue && loggedUser) {
      if (rememberMe) {
        localStorage.setItem('coarc_token', tokenValue);
      } else {
        sessionStorage.setItem('coarc_token', tokenValue);
      }
      setUser(loggedUser);
      setAuthNoticeReason('');
      setIsLoginModalRequested(false);

      if (pendingAction) {
        const actionToRun = pendingAction;
        setPendingAction(null);
        setTimeout(() => actionToRun(), 150);
      }
      return loggedUser;
    }
  };

  const logout = () => {
    localStorage.removeItem('coarc_token');
    sessionStorage.removeItem('coarc_token');
    setUser(null);
    setPendingAction(null);
    setAuthNoticeReason('');
  };

  const isAuthenticated = !!user;
  const isAdmin = !!user; // Profe o Admin autenticado
  const isSuperAdmin = user?.role === 'ADMIN';

  /**
   * Ejecuta la acción si el usuario está autenticado.
   * Si no está autenticado, abre el modal de login mostrando un aviso claro de requerimiento.
   */
  const requireAuth = (actionCallback, noticeMessage = 'Debes iniciar sesión con tus credenciales de Coordinador Arbitral o Administrador para realizar esta acción.') => {
    if (isAdmin) {
      actionCallback();
    } else {
      setPendingAction(() => actionCallback);
      setAuthNoticeReason(noticeMessage);
      setIsLoginModalRequested(true);
    }
  };

  const clearAuthNotice = () => {
    setAuthNoticeReason('');
    setIsLoginModalRequested(false);
    setPendingAction(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated,
      isAdmin,
      isSuperAdmin,
      requireAuth,
      authNoticeReason,
      isLoginModalRequested,
      clearAuthNotice
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
