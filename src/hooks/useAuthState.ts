import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import { auth } from "@/firebase/client";
import {
  getSessionSecret,
  readPersistedSession,
} from "@/firebase/persistedSession";
import {
  workspaceCache,
  type WorkspaceUser,
} from "@/utils/cache/workspaceCache";

const BOOTSTRAP_TIMEOUT_MS = 2500;

const toCachedUser = ({ uid, email }: WorkspaceUser): WorkspaceUser => ({
  uid,
  email,
});

export const useAuthState = () => {
  const initialFirebaseUser = auth.currentUser;
  const [persistedSession] = useState(() => readPersistedSession());

  const initialCachedSummary = initialFirebaseUser
    ? toCachedUser(initialFirebaseUser)
    : persistedSession
      ? toCachedUser(persistedSession)
      : null;

  const [user, setUser] = useState<User | null>(initialFirebaseUser);
  const [cachedUser, setCachedUserState] = useState<WorkspaceUser | null>(
    initialCachedSummary,
  );
  const [cacheReady, setCacheReady] = useState(false);
  const [initializing, setInitializing] = useState(
    !initialFirebaseUser && !initialCachedSummary,
  );
  const [error, setError] = useState<Error | null>(null);
  const lastCachedUidRef = useRef<string | null>(
    initialCachedSummary?.uid ?? null,
  );

  useEffect(() => {
    let cancelled = false;

    const bootstrapTimeout = window.setTimeout(() => {
      if (!cancelled) {
        setInitializing(false);
      }
    }, BOOTSTRAP_TIMEOUT_MS);

    const finishBootstrap = () => {
      if (!cancelled) {
        window.clearTimeout(bootstrapTimeout);
        setInitializing(false);
      }
    };

    const adoptCache = (summary: WorkspaceUser, ready: boolean) => {
      if (!cancelled) {
        setCachedUserState(summary);
        setCacheReady(ready);
        lastCachedUidRef.current = summary.uid;
      }
    };

    const openCache = async (summary: WorkspaceUser, secret: string) => {
      const ready = await workspaceCache.open(summary, secret);
      adoptCache(summary, ready);
      return ready;
    };

    const closeCache = async () => {
      await workspaceCache.close({
        clearCollectionsFor: lastCachedUidRef.current,
      });
      lastCachedUidRef.current = null;
      if (!cancelled) {
        setCachedUserState(null);
        setCacheReady(false);
      }
    };

    const bootstrap = async () => {
      if (initialFirebaseUser) {
        const secret = getSessionSecret(initialFirebaseUser);
        if (secret) {
          await openCache(toCachedUser(initialFirebaseUser), secret);
        } else if (!cancelled) {
          setCachedUserState(toCachedUser(initialFirebaseUser));
        }
        return;
      }

      if (persistedSession) {
        const { refreshToken } = persistedSession;
        if (await openCache(toCachedUser(persistedSession), refreshToken)) {
          finishBootstrap();
        }
        return;
      }

      const restored = await workspaceCache.restore();
      if (restored) {
        adoptCache(restored.user, restored.ready);
        if (restored.ready) {
          finishBootstrap();
        }
      }
    };

    void bootstrap();

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        window.clearTimeout(bootstrapTimeout);
        setUser(nextUser);
        const settle = () => {
          if (!cancelled) {
            setInitializing(false);
          }
        };
        if (!nextUser) {
          void closeCache().finally(settle);
          return;
        }

        const secret = getSessionSecret(nextUser);
        if (!secret) {
          if (!cancelled) {
            setCachedUserState(toCachedUser(nextUser));
            setCacheReady(false);
          }
          settle();
          return;
        }

        void openCache(toCachedUser(nextUser), secret).finally(settle);
      },
      (err) => {
        window.clearTimeout(bootstrapTimeout);
        setError(err);
        setInitializing(false);
      },
    );

    return () => {
      cancelled = true;
      window.clearTimeout(bootstrapTimeout);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectiveCachedUser = useMemo(
    () => (user ? toCachedUser(user) : cachedUser),
    [user, cachedUser],
  );

  return {
    user,
    cachedUser: effectiveCachedUser,
    initializing,
    error,
    cacheReady,
  };
};
