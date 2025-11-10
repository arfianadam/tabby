import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import { auth } from "../firebase/client";
import {
  clearCachedCollections,
  configureCacheEncryption,
  setCachedUser,
  type CachedUser,
} from "../utils/cache";

type PersistedAuthRecord = {
  uid: string;
  email?: string | null;
  stsTokenManager?: { refreshToken?: string };
};

const toCachedUser = (
  firebaseUser: Pick<User, "uid" | "email">,
): CachedUser => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
});

const getCacheSecret = (firebaseUser: User): string | null => {
  const tokenManager = (
    firebaseUser as User & {
      stsTokenManager?: { refreshToken?: string };
    }
  ).stsTokenManager;
  return tokenManager?.refreshToken ?? null;
};

const getPersistedAuthRecord = (): PersistedAuthRecord | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const apiKey = auth.app.options.apiKey;
    const appName = auth.app.name ?? "[DEFAULT]";
    if (!apiKey) {
      return null;
    }
    const key = `firebase:authUser:${apiKey}:${appName}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as PersistedAuthRecord;
  } catch {
    return null;
  }
};

type CacheContext = {
  uid: string;
  email?: string | null;
  secret: string;
};

export const useAuthState = () => {
  const initialFirebaseUser = auth.currentUser;
  const [persistedAuthRecord] = useState<PersistedAuthRecord | null>(() =>
    getPersistedAuthRecord(),
  );

  const initialCachedSummary = initialFirebaseUser
    ? toCachedUser(initialFirebaseUser)
    : persistedAuthRecord?.uid &&
        persistedAuthRecord.stsTokenManager?.refreshToken
      ? {
          uid: persistedAuthRecord.uid,
          email: persistedAuthRecord.email,
        }
      : null;

  const [user, setUser] = useState<User | null>(initialFirebaseUser);
  const [cachedUser, setCachedUserState] = useState<CachedUser | null>(
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

    const applyCacheContext = async (
      context: CacheContext | null,
      options?: { clearCollections?: boolean },
    ) => {
      if (!context) {
        await configureCacheEncryption(null, null);
        await setCachedUser(null);
        if (options?.clearCollections && lastCachedUidRef.current) {
          await clearCachedCollections(lastCachedUidRef.current);
        }
        lastCachedUidRef.current = null;
        if (!cancelled) {
          setCachedUserState(null);
          setCacheReady(false);
        }
        return;
      }

      try {
        await configureCacheEncryption(context.uid, context.secret);
        const summary: CachedUser = {
          uid: context.uid,
          email: context.email,
        };
        await setCachedUser(summary);
        if (!cancelled) {
          setCachedUserState(summary);
          setCacheReady(true);
          lastCachedUidRef.current = summary.uid;
        }
      } catch {
        if (!cancelled) {
          setCacheReady(false);
        }
      }
    };

    const bootstrap = async () => {
      if (initialFirebaseUser) {
        const secret = getCacheSecret(initialFirebaseUser);
        if (secret) {
          await applyCacheContext({
            uid: initialFirebaseUser.uid,
            email: initialFirebaseUser.email,
            secret,
          });
        } else if (!cancelled) {
          setCachedUserState(toCachedUser(initialFirebaseUser));
        }
        return;
      }

      if (
        persistedAuthRecord?.uid &&
        persistedAuthRecord.stsTokenManager?.refreshToken
      ) {
        await applyCacheContext({
          uid: persistedAuthRecord.uid,
          email: persistedAuthRecord.email,
          secret: persistedAuthRecord.stsTokenManager.refreshToken,
        });
      }
    };

    void bootstrap();

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        if (!nextUser) {
          void applyCacheContext(null, { clearCollections: true }).finally(
            () => {
              if (!cancelled) {
                setInitializing(false);
              }
            },
          );
          return;
        }

        const secret = getCacheSecret(nextUser);
        if (!secret) {
          if (!cancelled) {
            setCachedUserState(toCachedUser(nextUser));
            setCacheReady(false);
            setInitializing(false);
          }
          return;
        }

        void applyCacheContext(
          {
            uid: nextUser.uid,
            email: nextUser.email,
            secret,
          },
          { clearCollections: false },
        ).finally(() => {
          if (!cancelled) {
            setInitializing(false);
          }
        });
      },
      (err) => {
        setError(err);
        setInitializing(false);
      },
    );

    return () => {
      cancelled = true;
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
