import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export class FirebaseAdminNotConfiguredError extends Error {
  readonly code = "NOT_CONFIGURED" as const;

  constructor() {
    super("Firebase Admin is not configured");
    this.name = "FirebaseAdminNotConfiguredError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidFirebaseIdTokenError extends Error {
  readonly code = "UNAUTHENTICATED" as const;

  constructor() {
    super("Firebase ID token is invalid");
    this.name = "InvalidFirebaseIdTokenError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export type FirebaseAdminServices = Readonly<{
  app: App;
  auth: Auth;
  db: Firestore;
}>;

function requiredEnvironment(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new FirebaseAdminNotConfiguredError();
  }

  return value;
}

function createAdminApp(): App {
  const projectId = requiredEnvironment("FIREBASE_ADMIN_PROJECT_ID");
  const clientEmail = requiredEnvironment("FIREBASE_ADMIN_CLIENT_EMAIL");
  const privateKey = requiredEnvironment("FIREBASE_ADMIN_PRIVATE_KEY").replace(
    /\\n/g,
    "\n",
  );

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

let services: FirebaseAdminServices | undefined;

export function getFirebaseAdminServices(): FirebaseAdminServices {
  if (services) {
    return services;
  }

  const app = getApps()[0] ?? createAdminApp();
  services = Object.freeze({
    app,
    auth: getAuth(app),
    db: getFirestore(app),
  });

  return services;
}

export async function verifyIdToken(token: string): Promise<DecodedIdToken> {
  try {
    return await getFirebaseAdminServices().auth.verifyIdToken(token);
  } catch (error) {
    if (error instanceof FirebaseAdminNotConfiguredError) {
      throw error;
    }

    throw new InvalidFirebaseIdTokenError();
  }
}
