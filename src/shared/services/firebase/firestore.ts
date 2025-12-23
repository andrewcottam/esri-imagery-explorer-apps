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

import { getFirestore, collection, doc, setDoc, addDoc } from 'firebase/firestore';
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
