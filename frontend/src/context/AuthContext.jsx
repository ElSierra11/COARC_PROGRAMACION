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
  const [user, setUser] = useState(defaultProfeUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('coarc_token');
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
            setUser(defaultProfeUser);
          }
        }
      } else {
        setUser(defaultProfeUser);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    const cleanUser = username.trim().toLowerCase();
    
    // Credenciales directas de SuperAdmin
    if ((cleanUser === 'alejosierra656@gmail.com' || cleanUser === 'alejosierra') && password === 'Alejandro10@') {
      localStorage.setItem('coarc_token', 'mock_superadmin_token');
      setUser(superAdminUser);
      return superAdminUser;
    }

    // Credenciales directas de Profe
    if ((cleanUser === 'admin' || cleanUser === 'profe') && password === 'coarc2026') {
      localStorage.setItem('coarc_token', 'mock_profe_token');
      setUser(defaultProfeUser);
      return defaultProfeUser;
    }

    try {
      const data = await authService.login(cleanUser, password);
      localStorage.setItem('coarc_token', data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('coarc_token');
    setUser(defaultProfeUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAdmin: true, // Cualquier visitante tiene permisos de Profe para programar
      isSuperAdmin: user?.role === 'ADMIN' // Únicamente alejosierra656@gmail.com
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
