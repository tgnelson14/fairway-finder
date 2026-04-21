import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface NetlifyUser {
  id: string;
  email: string;
  user_metadata: { full_name?: string; avatar_url?: string };
}

interface AuthContextValue {
  user: NetlifyUser | null;
  login: () => void;
  logout: () => void;
}

declare global {
  interface Window {
    netlifyIdentity?: {
      on(event: string, callback: (user?: NetlifyUser) => void): void;
      init(): void;
      open(): void;
      close(): void;
      logout(): void;
    };
  }
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NetlifyUser | null>(null);

  useEffect(() => {
    const identity = window.netlifyIdentity;
    if (!identity) return;

    identity.on('init', (u) => setUser(u ?? null));
    identity.on('login', (u) => {
      setUser(u ?? null);
      identity.close();
    });
    identity.on('logout', () => setUser(null));
    identity.init();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login: () => window.netlifyIdentity?.open(),
      logout: () => window.netlifyIdentity?.logout(),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
