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
import { RendererData } from '@shared/services/firebase/firestore';

export type RenderersState = {
    /**
     * Custom renderers loaded from Firestore
     */
    customRenderers: RendererData[];
    /**
     * Whether renderers are currently being loaded
     */
    loading: boolean;
    /**
     * ID of renderer that needs a screenshot captured after next render
     */
    pendingScreenshotRendererId: string | null;
};

export const initialRenderersState: RenderersState = {
    customRenderers: [],
    loading: false,
    pendingScreenshotRendererId: null,
};

const slice = createSlice({
    name: 'Renderers',
    initialState: initialRenderersState,
    reducers: {
        customRenderersLoaded: (state, action: PayloadAction<RendererData[]>) => {
            state.customRenderers = action.payload;
            state.loading = false;
        },
        customRenderersLoadingStarted: (state) => {
            state.loading = true;
        },
        customRenderersCleared: (state) => {
            state.customRenderers = [];
            state.loading = false;
        },
        pendingScreenshotRendererIdSet: (
            state,
            action: PayloadAction<string | null>
        ) => {
            state.pendingScreenshotRendererId = action.payload;
        },
        customRendererAdded: (state, action: PayloadAction<RendererData>) => {
            state.customRenderers.push(action.payload);
        },
        customRendererDeleted: (state, action: PayloadAction<string>) => {
            state.customRenderers = state.customRenderers.filter(
                (r) => r.id !== action.payload
            );
        },
        customRendererImageUpdated: (
            state,
            action: PayloadAction<{ rendererId: string; image: string }>
        ) => {
            const renderer = state.customRenderers.find(
                (r) => r.id === action.payload.rendererId
            );
            if (renderer) {
                renderer.image = action.payload.image;
            }
        },
    },
});

const { reducer } = slice;

export const {
    customRenderersLoaded,
    customRenderersLoadingStarted,
    customRenderersCleared,
    pendingScreenshotRendererIdSet,
    customRendererAdded,
    customRendererDeleted,
    customRendererImageUpdated,
} = slice.actions;

export default reducer;
