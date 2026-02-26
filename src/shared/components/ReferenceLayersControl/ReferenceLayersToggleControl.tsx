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

import React, { FC } from 'react';
import { useAppDispatch } from '@shared/store/configureStore';
import { useTranslation } from 'react-i18next';
import { FirebaseAuthButton } from '@shared/components/FirebaseAuthButton/FirebaseAuthButton';
import { shouldShowAboutThisAppToggled } from '@shared/store/UI/reducer';

export const ReferenceLayersToggleControl: FC = () => {
    const dispatch = useAppDispatch();

    const { t } = useTranslation();

    return (
        <div className="md:flex relative py-2 theme-background">
            <FirebaseAuthButton />
            <div
                className="mx-2 my-1 md:my-0 cursor-pointer z-10 flex items-center"
                onClick={() => dispatch(shouldShowAboutThisAppToggled())}
                title={t('about_this_app')}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    height="20"
                    width="20"
                >
                    <path
                        fill="currentColor"
                        d="M12.5 7.5a1 1 0 1 1 1-1 1.002 1.002 0 0 1-1 1zM13 18V9h-2v1h1v8h-1v1h3v-1zm9.8-5.5A10.3 10.3 0 1 1 12.5 2.2a10.297 10.297 0 0 1 10.3 10.3zm-1 0a9.3 9.3 0 1 0-9.3 9.3 9.31 9.31 0 0 0 9.3-9.3z"
                    />
                    <path fill="none" d="M0 0h24v24H0z" />
                </svg>
            </div>
        </div>
    );
};
