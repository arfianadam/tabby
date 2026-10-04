import type { User } from "firebase/auth";
import { auth } from "@/firebase/client";

// Relies on Firebase Auth internals: the browserLocalPersistence record and
// the refresh token kept on the user's stsTokenManager.

type StsTokenManager = { refreshToken?: string };

type PersistedAuthRecord = {
  uid?: string;
  email?: string | null;
  stsTokenManager?: StsTokenManager;
};

export type PersistedSession = {
  uid: string;
  email?: string | null;
  refreshToken: string;
};

/** The signed-in session Firebase left in localStorage, if it is usable. */
export const readPersistedSession = (): PersistedSession | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const apiKey = auth.app.options.apiKey;
    const appName = auth.app.name ?? "[DEFAULT]";
    if (!apiKey) {
      return null;
    }
    const raw = window.localStorage.getItem(
      `firebase:authUser:${apiKey}:${appName}`,
    );
    if (!raw) {
      return null;
    }
    const record = JSON.parse(raw) as PersistedAuthRecord | null;
    const refreshToken = record?.stsTokenManager?.refreshToken;
    if (!record?.uid || !refreshToken) {
      return null;
    }
    return { uid: record.uid, email: record.email, refreshToken };
  } catch {
    return null;
  }
};

/** A per-session secret for the user, stable until they sign out. */
export const getSessionSecret = (user: User): string | null =>
  (user as User & { stsTokenManager?: StsTokenManager }).stsTokenManager
    ?.refreshToken || null;
