/**
 * Native Google Credential Manager module for Android
 * Uses Android Credential Manager for Sign in with Google with nonce support
 *
 * @see https://developer.android.com/identity/sign-in/credential-manager-siwg
 * @see https://auth0.com/docs/authenticate/identity-providers/social-identity-providers/google-native
 */

import { NativeModules, Platform } from "react-native";

export interface GoogleSignInResult {
  idToken: string;
  nonce: string;
  id: string;
  displayName?: string;
  familyName?: string;
  givenName?: string;
  profilePictureUri?: string;
}

export interface GoogleCredentialManagerInterface {
  signIn(webClientId: string, filterByAuthorizedAccounts: boolean): Promise<GoogleSignInResult>;
  signOut(): Promise<void>;
}

// Status codes matching the native module
export const GoogleCredentialManagerStatusCodes = {
  SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",
  NO_SAVED_CREDENTIAL_FOUND: "NO_SAVED_CREDENTIAL_FOUND",
  SIGN_IN_FAILED: "SIGN_IN_FAILED",
} as const;

const GoogleCredentialManager: GoogleCredentialManagerInterface | null =
  Platform.OS === "android" ? NativeModules.GoogleCredentialManager : null;

export default GoogleCredentialManager;
