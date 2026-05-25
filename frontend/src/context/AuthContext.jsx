import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Safely get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Invalid user data in localStorage:', error);
        localStorage.removeItem('user');
        setUser(null);
      }
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email && password) {
          const userData = { 
            email, 
            name: email.split('@')[0],
            role: 'Administrator'
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          resolve(true);
        } else {
          resolve(false);
        }
        setLoading(false);
      }, 800);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 