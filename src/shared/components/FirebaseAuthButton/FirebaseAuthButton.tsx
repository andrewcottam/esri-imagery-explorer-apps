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

import React, { FC, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@shared/store/configureStore';
import {
    selectFirebaseUser,
    selectFirebaseAuthLoading,
} from '@shared/store/Firebase/selectors';
import { signInWithGoogle, signOutUser } from '@shared/services/firebase/auth';

const LoginIcon = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        height="16"
        width="16"
    >
        <path
            fill="currentColor"
            d="M9 1h6v14H9v-1h5V2H9zM7.146 11.854l.708-.708L10.207 8.5H1v-1h9.207L7.854 5.146l-.708-.707L11.293 8.5z"
        />
        <path fill="none" d="M0 0h16v16H0z" />
    </svg>
);

export const FirebaseAuthButton: FC = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectFirebaseUser);
    const loading = useAppSelector(selectFirebaseAuthLoading);
    const [showTooltip, setShowTooltip] = useState(false);

    const handleClick = () => {
        if (user) {
            signOutUser(dispatch);
        } else {
            signInWithGoogle(dispatch);
        }
    };

    if (loading) {
        return (
            <div className="mx-2 my-1 md:my-0 flex items-center text-custom-light-blue">
                <span className="text-xs">Loading...</span>
            </div>
        );
    }

    if (user) {
        return (
            <div
                className="relative mx-2 my-1 md:my-0 cursor-pointer z-10 flex items-center"
                onClick={handleClick}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                {user.photoURL ? (
                    <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="w-6 h-6 rounded-full"
                    />
                ) : (
                    <div className="w-6 h-6 rounded-full bg-custom-light-blue flex items-center justify-center text-custom-background text-xs font-bold">
                        {user.displayName?.[0]?.toUpperCase() ||
                            user.email?.[0]?.toUpperCase() ||
                            'U'}
                    </div>
                )}
                <span className="ml-2 text-xs text-custom-light-blue">
                    {user.displayName || user.email}
                </span>

                {showTooltip && (
                    <div className="absolute top-full mt-2 right-0 bg-custom-background-95 border border-custom-light-blue-50 px-3 py-2 rounded text-xs whitespace-nowrap z-50">
                        <div className="text-custom-light-blue">
                            Click to sign out
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className="mx-2 my-1 md:my-0 cursor-pointer z-10 flex items-center text-custom-light-blue"
            onClick={handleClick}
        >
            {LoginIcon}
            <span className="ml-1 text-xs">Sign In</span>
        </div>
    );
};
