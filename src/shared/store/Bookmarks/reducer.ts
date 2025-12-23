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
import type { ProjectData, BookmarkData } from '@shared/services/firebase/firestore';

export type BookmarksState = {
    /**
     * List of user's projects
     */
    projects: ProjectData[];
    /**
     * Currently selected project ID
     */
    selectedProjectId: string | null;
    /**
     * List of bookmarks for the selected project
     */
    bookmarks: BookmarkData[];
    /**
     * Currently selected bookmark ID
     */
    selectedBookmarkId: string | null;
    /**
     * Whether projects are being loaded
     */
    loadingProjects: boolean;
    /**
     * Whether bookmarks are being loaded
     */
    loadingBookmarks: boolean;
};

export const initialBookmarksState: BookmarksState = {
    projects: [],
    selectedProjectId: null,
    bookmarks: [],
    selectedBookmarkId: null,
    loadingProjects: false,
    loadingBookmarks: false,
};

const slice = createSlice({
    name: 'Bookmarks',
    initialState: initialBookmarksState,
    reducers: {
        projectsLoaded: (state, action: PayloadAction<ProjectData[]>) => {
            state.projects = action.payload;
            state.loadingProjects = false;
        },
        projectsLoadingStarted: (state) => {
            state.loadingProjects = true;
        },
        projectSelected: (state, action: PayloadAction<string | null>) => {
            state.selectedProjectId = action.payload;
            // Clear bookmarks when changing projects
            if (action.payload !== state.selectedProjectId) {
                state.bookmarks = [];
                state.selectedBookmarkId = null;
            }
        },
        bookmarksLoaded: (state, action: PayloadAction<BookmarkData[]>) => {
            state.bookmarks = action.payload;
            state.loadingBookmarks = false;
        },
        bookmarksLoadingStarted: (state) => {
            state.loadingBookmarks = true;
        },
        bookmarkSelected: (state, action: PayloadAction<string | null>) => {
            state.selectedBookmarkId = action.payload;
        },
        bookmarksCleared: (state) => {
            state.projects = [];
            state.selectedProjectId = null;
            state.bookmarks = [];
            state.selectedBookmarkId = null;
        },
    },
});

const { reducer } = slice;

export const {
    projectsLoaded,
    projectsLoadingStarted,
    projectSelected,
    bookmarksLoaded,
    bookmarksLoadingStarted,
    bookmarkSelected,
    bookmarksCleared,
} = slice.actions;

export default reducer;
