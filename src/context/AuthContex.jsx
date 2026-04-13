import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // ✅ Load cached user (fast UI)
  const [user, setUserState] = useState(() => {
    const cached = sessionStorage.getItem('user');
    return cached ? JSON.parse(cached) : null;
  });

  // 🔥 ALWAYS start loading true
  const [loading, setLoading] = useState(true);

  // ✅ setter with cache sync
  const setUser = (userData) => {
    if (userData) {
      sessionStorage.setItem('user', JSON.stringify(userData));
    } else {
      sessionStorage.removeItem('user');
    }
    setUserState(userData);
  };

  // 🔥 Auth check (VERY IMPORTANT)
  useEffect(() => {
    const controller = new AbortController();

    const fetchUser = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACK_DEV_API}/api/me`,
          {
            credentials: 'include',
            signal: controller.signal,
          }
        );

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // ❌ not authenticated
          setUser(null);
        }
      } catch (err) {
        console.log("Auth error:", err);
        setUser(null);
      } finally {
        // ✅ ALWAYS STOP LOADING
        setLoading(false);
      }
    };

    fetchUser();

    // 🔥 safety timeout (prevents infinite loader)
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// hook
export const useAuth = () => useContext(AuthContext);
