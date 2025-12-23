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

import {
    getFirestore,
    collection,
    doc,
    setDoc,
    addDoc,
    getDocs,
    query,
    where,
} from 'firebase/firestore';
import { getApp } from 'firebase/app';

/**
 * Represents a spatial bookmark with map view information
 */
export type SpatialBookmark = {
    name: string;
    center: number[];
    zoom: number;
    extent: {
        xmin: number;
        ymin: number;
        xmax: number;
        ymax: number;
    };
    createdAt: number;
    userId: string;
};

/**
 * Save a spatial bookmark to Firestore
 *
 * @param projectName - The project name (document ID in sentinel2-explorer collection)
 * @param bookmarkName - The name of the bookmark
 * @param mapViewData - The current map view data (center, zoom, extent)
 * @param userId - The user ID from Firebase Auth
 * @returns Promise<void>
 */
export const saveSpatialBookmark = async (
    projectName: string,
    bookmarkName: string,
    mapViewData: {
        center: number[];
        zoom: number;
        extent: {
            xmin: number;
            ymin: number;
            xmax: number;
            ymax: number;
        };
    },
    userId: string
): Promise<void> => {
    try {
        const app = getApp();
        const db = getFirestore(app);

        // Reference to the project document
        const projectDocRef = doc(db, 'sentinel2-explorer', projectName);

        // Ensure the project document exists (create it if it doesn't)
        await setDoc(
            projectDocRef,
            {
                name: projectName,
                createdAt: Date.now(),
                userId,
            },
            { merge: true }
        );

        // Reference to the bookmarks subcollection
        const bookmarksCollectionRef = collection(projectDocRef, 'bookmarks');

        // Create the bookmark data
        const bookmarkData: SpatialBookmark = {
            name: bookmarkName,
            center: mapViewData.center,
            zoom: mapViewData.zoom,
            extent: mapViewData.extent,
            createdAt: Date.now(),
            userId,
        };

        // Add the bookmark to the subcollection
        await addDoc(bookmarksCollectionRef, bookmarkData);

        console.log('Spatial bookmark saved successfully:', {
            project: projectName,
            bookmark: bookmarkName,
        });
    } catch (error) {
        console.error('Error saving spatial bookmark:', error);
        throw error;
    }
};

/**
 * Project data returned from Firestore
 */
export type ProjectData = {
    id: string;
    name: string;
    createdAt: number;
    userId: string;
};

/**
 * Bookmark data returned from Firestore with ID
 */
export type BookmarkData = SpatialBookmark & {
    id: string;
};

/**
 * Fetch all projects for a specific user
 *
 * @param userId - The user ID from Firebase Auth
 * @returns Promise<ProjectData[]>
 */
export const fetchUserProjects = async (
    userId: string
): Promise<ProjectData[]> => {
    try {
        const app = getApp();
        const db = getFirestore(app);

        // Query projects collection for user's projects
        const projectsRef = collection(db, 'sentinel2-explorer');
        const q = query(projectsRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);

        const projects: ProjectData[] = [];
        querySnapshot.forEach((doc) => {
            projects.push({
                id: doc.id,
                ...doc.data(),
            } as ProjectData);
        });

        console.log(`Fetched ${projects.length} projects for user ${userId}`);
        return projects;
    } catch (error) {
        console.error('Error fetching user projects:', error);
        throw error;
    }
};

/**
 * Fetch all bookmarks for a specific project and user
 *
 * @param projectId - The project document ID
 * @param userId - The user ID from Firebase Auth
 * @returns Promise<BookmarkData[]>
 */
export const fetchProjectBookmarks = async (
    projectId: string,
    userId: string
): Promise<BookmarkData[]> => {
    try {
        const app = getApp();
        const db = getFirestore(app);

        // Reference to the bookmarks subcollection
        const bookmarksRef = collection(
            db,
            'sentinel2-explorer',
            projectId,
            'bookmarks'
        );

        // Query bookmarks for this user
        const q = query(bookmarksRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);

        const bookmarks: BookmarkData[] = [];
        querySnapshot.forEach((doc) => {
            bookmarks.push({
                id: doc.id,
                ...doc.data(),
            } as BookmarkData);
        });

        console.log(
            `Fetched ${bookmarks.length} bookmarks for project ${projectId}`
        );
        return bookmarks;
    } catch (error) {
        console.error('Error fetching project bookmarks:', error);
        throw error;
    }
};
