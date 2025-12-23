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

import { RootState } from '../configureStore';

export const selectProjects = (state: RootState) => state.Bookmarks.projects;

export const selectSelectedProjectId = (state: RootState) =>
    state.Bookmarks.selectedProjectId;

export const selectBookmarks = (state: RootState) => state.Bookmarks.bookmarks;

export const selectSelectedBookmarkId = (state: RootState) =>
    state.Bookmarks.selectedBookmarkId;

export const selectLoadingProjects = (state: RootState) =>
    state.Bookmarks.loadingProjects;

export const selectLoadingBookmarks = (state: RootState) =>
    state.Bookmarks.loadingBookmarks;
