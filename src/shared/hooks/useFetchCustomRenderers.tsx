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

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@shared/store/configureStore';
import { selectFirebaseUser } from '@shared/store/Firebase/selectors';
import {
    customRenderersLoaded,
    customRenderersLoadingStarted,
    customRenderersCleared,
} from '@shared/store/Renderers/reducer';
import { fetchUserRenderers } from '@shared/services/firebase/firestore';
import { populateCustomRendererDefinitions } from '@shared/store/ImageryScene/thunks';

/**
 * Hook that automatically fetches custom renderers from Firestore when user logs in
 * and clears them when user logs out
 */
export const useFetchCustomRenderers = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectFirebaseUser);

    useEffect(() => {
        const loadRenderers = async () => {
            if (!user) {
                // Clear renderers when user logs out
                dispatch(customRenderersCleared());
                return;
            }

            try {
                dispatch(customRenderersLoadingStarted());
                const renderers = await fetchUserRenderers(user.uid);
                dispatch(customRenderersLoaded(renderers));

                // After loading custom renderers, populate definitions in any scenes
                // that have custom renderer names but no definitions (e.g., loaded from URL)
                dispatch(populateCustomRendererDefinitions(renderers));
            } catch (error) {
                console.error('Error loading custom renderers:', error);
                // Clear on error
                dispatch(customRenderersCleared());
            }
        };

        loadRenderers();
    }, [user?.uid, dispatch]);
};
