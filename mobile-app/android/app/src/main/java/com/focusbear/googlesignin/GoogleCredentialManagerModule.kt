package com.focusbear.googlesignin

import android.util.Log
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.security.MessageDigest
import java.util.UUID

/**
 * Native module for Google Sign-In using Android Credential Manager
 * Implements Sign in with Google per: https://developer.android.com/identity/sign-in/credential-manager-siwg
 * 
 * This generates a nonce for token replay protection as required by Auth0:
 * https://auth0.com/docs/authenticate/identity-providers/social-identity-providers/google-native
 */
class GoogleCredentialManagerModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "GoogleCredentialManager"
        const val NAME = "GoogleCredentialManager"
        
        // Error codes matching @react-native-google-signin/google-signin statusCodes
        const val SIGN_IN_CANCELLED = "SIGN_IN_CANCELLED"
        const val NO_SAVED_CREDENTIAL_FOUND = "NO_SAVED_CREDENTIAL_FOUND"
        const val SIGN_IN_FAILED = "SIGN_IN_FAILED"
    }

    private val credentialManager: CredentialManager by lazy {
        CredentialManager.create(reactApplicationContext)
    }

    override fun getName(): String = NAME

    /**
     * Generate a cryptographically random nonce for token replay protection
     */
    private fun generateNonce(): String {
        val rawNonce = UUID.randomUUID().toString()
        val bytes = rawNonce.toByteArray()
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(bytes)
        return digest.fold("") { str, it -> str + "%02x".format(it) }
    }

    /**
     * Sign in with Google using Credential Manager
     * @param webClientId The OAuth 2.0 Web Client ID from Google Cloud Console
     * @param filterByAuthorizedAccounts If true, only show accounts that have previously authorized the app
     * @param promise React Native promise to resolve with the result
     */
    @ReactMethod
    fun signIn(webClientId: String, filterByAuthorizedAccounts: Boolean, promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject(SIGN_IN_FAILED, "Activity is null")
            return
        }

        val nonce = generateNonce()
        
        val googleIdOption = GetGoogleIdOption.Builder()
            .setServerClientId(webClientId)
            .setNonce(nonce)
            .setFilterByAuthorizedAccounts(filterByAuthorizedAccounts)
            .setAutoSelectEnabled(false)
            .build()

        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()

        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result = credentialManager.getCredential(
                    request = request,
                    context = activity,
                )
                handleSignInResult(result, nonce, promise)
            } catch (e: GetCredentialCancellationException) {
                Log.d(TAG, "User cancelled sign-in")
                promise.reject(SIGN_IN_CANCELLED, "User cancelled the sign-in", e)
            } catch (e: NoCredentialException) {
                Log.d(TAG, "No credentials available")
                // If filtering by authorized accounts failed, try without filter
                if (filterByAuthorizedAccounts) {
                    signIn(webClientId, false, promise)
                } else {
                    promise.reject(NO_SAVED_CREDENTIAL_FOUND, "No Google accounts found", e)
                }
            } catch (e: GetCredentialException) {
                Log.e(TAG, "Sign-in failed", e)
                promise.reject(SIGN_IN_FAILED, e.message ?: "Sign-in failed", e)
            }
        }
    }

    /**
     * Handle the successful credential response
     */
    private fun handleSignInResult(result: GetCredentialResponse, nonce: String, promise: Promise) {
        val credential = result.credential

        when (credential) {
            is CustomCredential -> {
                if (credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                    try {
                        val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                        
                        val resultMap = Arguments.createMap().apply {
                            putString("idToken", googleIdTokenCredential.idToken)
                            putString("nonce", nonce)
                            putString("id", googleIdTokenCredential.id)
                            putString("displayName", googleIdTokenCredential.displayName)
                            putString("familyName", googleIdTokenCredential.familyName)
                            putString("givenName", googleIdTokenCredential.givenName)
                            googleIdTokenCredential.profilePictureUri?.let {
                                putString("profilePictureUri", it.toString())
                            }
                        }
                        
                        Log.d(TAG, "Sign-in successful for: ${googleIdTokenCredential.id}")
                        promise.resolve(resultMap)
                    } catch (e: GoogleIdTokenParsingException) {
                        Log.e(TAG, "Invalid Google ID token", e)
                        promise.reject(SIGN_IN_FAILED, "Invalid Google ID token", e)
                    }
                } else {
                    promise.reject(SIGN_IN_FAILED, "Unexpected credential type: ${credential.type}")
                }
            }
            else -> {
                promise.reject(SIGN_IN_FAILED, "Unexpected credential type")
            }
        }
    }

    /**
     * Sign out - clears the credential state
     */
    @ReactMethod
    fun signOut(promise: Promise) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                credentialManager.clearCredentialState(
                    androidx.credentials.ClearCredentialStateRequest()
                )
                promise.resolve(null)
            } catch (e: Exception) {
                Log.e(TAG, "Sign-out failed", e)
                promise.reject("SIGN_OUT_FAILED", e.message ?: "Sign-out failed", e)
            }
        }
    }
}

