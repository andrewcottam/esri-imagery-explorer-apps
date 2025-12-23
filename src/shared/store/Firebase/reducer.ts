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

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from 'firebase/auth';

/**
 * Serializable user data from Firebase Authentication.
 * We don't store the entire User object because it contains non-serializable data.
 */
export type FirebaseUserData = {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
};

export type FirebaseState = {
    /**
     * Serializable user data from Firebase Authentication
     */
    user: FirebaseUserData | null;
    /**
     * Whether authentication is in progress
     */
    loading: boolean;
    /**
     * Error message from authentication operations
     */
    error: string | null;
};

export const initialFirebaseState: FirebaseState = {
    user: null,
    loading: false,
    error: null,
};

const slice = createSlice({
    name: 'Firebase',
    initialState: initialFirebaseState,
    reducers: {
        authLoadingChanged: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        authErrorChanged: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        userChanged: (state, action: PayloadAction<FirebaseUserData | null>) => {
            state.user = action.payload;
        },
    },
});

const { reducer } = slice;

export const { authLoadingChanged, authErrorChanged, userChanged } =
    slice.actions;

export default reducer;
