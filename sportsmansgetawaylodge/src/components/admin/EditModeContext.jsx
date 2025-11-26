import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@/api/entities';

const EditModeContext = createContext();

export const useEditMode = () => useContext(EditModeContext);

export const EditModeProvider = ({ children }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const currentUser = await User.me();
        if (currentUser && currentUser.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          setIsEditMode(false); // Ensure edit mode is off if not admin
        }
      } catch (error) {
        // User not logged in
        setIsAdmin(false);
        setIsEditMode(false);
      }
    };
    checkUserRole();
  }, []);

  const toggleEditMode = () => {
    if (isAdmin) {
      setIsEditMode(prev => !prev);
    }
  };

  const value = { isEditMode, toggleEditMode, isAdmin };

  return (
    <EditModeContext.Provider value={value}>
      {children}
    </EditModeContext.Provider>
  );
};