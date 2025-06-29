import React, { createContext, useState } from 'react';

// Kullanıcı context'i oluştur
export const UserContext = createContext(null);


export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() =>{  // Kullanıcı bilgisi
  const storedUser = JSON.parse(localStorage.getItem('user'));
  return storedUser || null;
});


  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};
