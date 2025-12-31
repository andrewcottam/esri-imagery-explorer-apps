/* Copyright 2025 Esri
 *
 * Licensed under the Apache License Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
    getAuth,
    signInWithPopup,
    signOut,
    GoogleAuthProvider,
    onAuthStateChanged,
    type Auth,
    type User,
} from 'firebase/auth';
import type { StoreDispatch } from '@shared/store/configureStore';
import {
    authLoadingChanged,
    authErrorChanged,
    userChanged,
    type FirebaseUserData,
} from '@shared/store/Firebase/reducer';

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;

/**
 * Converts Firebase User object to serializable FirebaseUserData.
 * We only store serializable data in Redux state.
 */
const convertUserToSerializable = (user: User | null): FirebaseUserData | null => {
    if (!user) return null;
    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
    };
};

/**
 * Initialize Firebase app and authentication.
 * This should be called once when the app starts.
 */
export const initializeFirebase = (dispatch: StoreDispatch): void => {
    if (firebaseApp) {
        console.warn('Firebase is already initialized');
        return;
    }

    try {
        const firebaseConfig = {
            apiKey: ENV_FIREBASE_API_KEY,
            authDomain: ENV_FIREBASE_AUTH_DOMAIN,
            projectId: ENV_FIREBASE_PROJECT_ID,
            storageBucket: ENV_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: ENV_FIREBASE_MESSAGING_SENDER_ID,
            appId: ENV_FIREBASE_APP_ID,
        };

        firebaseApp = initializeApp(firebaseConfig);
        auth = getAuth(firebaseApp);

        // Set up auth state listener
        onAuthStateChanged(auth, (user) => {
            dispatch(userChanged(convertUserToSerializable(user)));
            dispatch(authLoadingChanged(false));
        });

        console.log('Firebase initialized successfully');
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        dispatch(authErrorChanged(error.message));
        dispatch(authLoadingChanged(false));
    }
};

/**
 * Sign in with Google using popup.
 */
export const signInWithGoogle = async (
    dispatch: StoreDispatch
): Promise<void> => {
    if (!auth) {
        console.error('Firebase auth is not initialized');
        return;
    }

    try {
        dispatch(authLoadingChanged(true));
        dispatch(authErrorChanged(null));

        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);

        console.log('Successfully signed in:', result.user.email);
    } catch (error) {
        console.error('Error signing in with Google:', error);
        dispatch(authErrorChanged(error.message));
        dispatch(authLoadingChanged(false));
    }
};

/**
 * Sign out the current user.
 */
export const signOutUser = async (dispatch: StoreDispatch): Promise<void> => {
    if (!auth) {
        console.error('Firebase auth is not initialized');
        return;
    }

    try {
        dispatch(authLoadingChanged(true));
        dispatch(authErrorChanged(null));

        await signOut(auth);

        console.log('Successfully signed out');
    } catch (error) {
        console.error('Error signing out:', error);
        dispatch(authErrorChanged(error.message));
        dispatch(authLoadingChanged(false));
    }
};
