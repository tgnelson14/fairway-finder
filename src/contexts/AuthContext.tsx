import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export interface NetlifyUser {
  id: string;
  email: string;
  user_metadata: { full_name?: string; avatar_url?: string };
}

interface IdentityToken {
  access_token: string;
  expires_at: number; // Unix timestamp in seconds
}

interface AuthContextValue {
  user: NetlifyUser | null;
  login: () => void;
  logout: () => void;
  getToken: () => Promise<string | null>;
}

declare global {
  interface Window {
    netlifyIdentity?: {
      on(event: string, callback: (user?: NetlifyUser) => void): void;
      init(): void;
      open(): void;
      close(): void;
      logout(): void;
      currentUser(): (NetlifyUser & { token: IdentityToken }) | null;
      refresh(): Promise<(NetlifyUser & { token: IdentityToken }) | null>;
    };
  }
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
  getToken: async () => null,
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

  const getToken = useCallback(async (): Promise<string | null> => {
    const identity = window.netlifyIdentity;
    if (!identity) return null;
    const current = identity.currentUser();
    if (!current) return null;
    // Refresh if expiring within 60 seconds
    if ((current.token.expires_at - 60) * 1000 < Date.now()) {
      const refreshed = await identity.refresh().catch(() => null);
      return refreshed?.token?.access_token ?? null;
    }
    return current.token.access_token;
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login: () => window.netlifyIdentity?.open(),
      logout: () => window.netlifyIdentity?.logout(),
      getToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
