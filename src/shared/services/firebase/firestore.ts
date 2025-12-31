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
    deleteDoc,
    query,
    where,
} from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { FirebaseUserData } from '@shared/store/Firebase/reducer';

/**
 * Ensure the user document exists with user metadata
 * This makes it easier to identify users in Firestore console
 *
 * @param userData - The Firebase user data
 * @returns Promise<void>
 */
const ensureUserDocumentExists = async (
    userData: FirebaseUserData
): Promise<void> => {
    const app = getApp();
    const db = getFirestore(app);

    const userDocRef = doc(db, 'sentinel2-explorer', userData.uid);

    // Create or update the user document with user metadata
    await setDoc(
        userDocRef,
        {
            email: userData.email,
            displayName: userData.displayName,
            lastUpdated: Date.now(),
        },
        { merge: true }
    );
};

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
    /**
     * Base64 data URL of the bookmark screenshot
     */
    image?: string;
};

/**
 * Represents a custom renderer configuration
 */
export type RendererConfig = {
    name: string;
    renderer: object; // The JSON renderer configuration (for in-memory use)
    rendererJson?: string; // The JSON string for Firestore storage
    createdAt: number;
    userId: string;
    /**
     * Base64 data URL of the renderer screenshot
     */
    image?: string;
};

/**
 * Renderer data returned from Firestore with ID
 */
export type RendererData = RendererConfig & {
    id: string;
};

/**
 * Save a spatial bookmark to Firestore
 * Path: sentinel2-explorer/<userid>/bookmarks/<project>/<bookmark_item>
 *
 * @param projectName - The project name (document ID in bookmarks collection)
 * @param bookmarkName - The name of the bookmark
 * @param mapViewData - The current map view data (center, zoom, extent)
 * @param userData - The Firebase user data (uid, email, displayName)
 * @param image - Optional base64 data URL of the bookmark screenshot
 * @returns Promise<BookmarkData> - The saved bookmark with ID
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
    userData: FirebaseUserData,
    image?: string
): Promise<BookmarkData> => {
    try {
        const app = getApp();
        const db = getFirestore(app);

        // Ensure user document exists with user metadata
        await ensureUserDocumentExists(userData);

        // Path: sentinel2-explorer/<userid>/bookmarks/<project>
        const userDocRef = doc(db, 'sentinel2-explorer', userData.uid);
        const bookmarksCollectionRef = collection(userDocRef, 'bookmarks');
        const projectDocRef = doc(bookmarksCollectionRef, projectName);

        // Ensure the project document exists (create it if it doesn't)
        await setDoc(
            projectDocRef,
            {
                name: projectName,
                createdAt: Date.now(),
                userId: userData.uid,
            },
            { merge: true }
        );

        // Reference to the bookmark items subcollection
        const bookmarkItemsCollectionRef = collection(projectDocRef, 'items');

        // Create the bookmark data
        const bookmarkData: SpatialBookmark = {
            name: bookmarkName,
            center: mapViewData.center,
            zoom: mapViewData.zoom,
            extent: mapViewData.extent,
            createdAt: Date.now(),
            userId: userData.uid,
            ...(image && { image }), // Include image if provided
        };

        // Add the bookmark to the subcollection
        const docRef = await addDoc(bookmarkItemsCollectionRef, bookmarkData);

        console.log('Spatial bookmark saved successfully:', {
            project: projectName,
            bookmark: bookmarkName,
        });

        // Return the bookmark data with ID
        return {
            id: docRef.id,
            ...bookmarkData,
        };
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
 * Path: sentinel2-explorer/<userid>/bookmarks
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

        // Path: sentinel2-explorer/<userid>/bookmarks
        const userDocRef = doc(db, 'sentinel2-explorer', userId);
        const bookmarksCollectionRef = collection(userDocRef, 'bookmarks');
        const querySnapshot = await getDocs(bookmarksCollectionRef);

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
 * Path: sentinel2-explorer/<userid>/bookmarks/<project>/items
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

        // Path: sentinel2-explorer/<userid>/bookmarks/<project>/items
        const bookmarkItemsRef = collection(
            db,
            'sentinel2-explorer',
            userId,
            'bookmarks',
            projectId,
            'items'
        );

        const querySnapshot = await getDocs(bookmarkItemsRef);

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

/**
 * Save a custom renderer to Firestore
 * Path: sentinel2-explorer/<userid>/renderers/<renderer_item>
 *
 * @param name - The name of the renderer
 * @param renderer - The renderer JSON configuration
 * @param userData - The Firebase user data (uid, email, displayName)
 * @returns Promise<RendererData> - The saved renderer with ID
 */
export const saveRenderer = async (
    name: string,
    renderer: object,
    userData: FirebaseUserData,
    image?: string
): Promise<RendererData> => {
    try {
        const app = getApp();
        const db = getFirestore(app);

        // Ensure user document exists with user metadata
        await ensureUserDocumentExists(userData);

        // Path: sentinel2-explorer/<userid>/renderers
        const userDocRef = doc(db, 'sentinel2-explorer', userData.uid);
        const renderersCollectionRef = collection(userDocRef, 'renderers');

        // Convert renderer object to JSON string to avoid nested array issues in Firestore
        const rendererJson = JSON.stringify(renderer);

        // Create the renderer data for Firestore (without the renderer object, use rendererJson instead)
        const firestoreData = {
            name,
            rendererJson, // Store as JSON string
            createdAt: Date.now(),
            userId: userData.uid,
            ...(image && { image }), // Include image if provided
        };

        // Add the renderer to the collection
        const docRef = await addDoc(renderersCollectionRef, firestoreData);

        console.log('Renderer saved successfully:', { name });

        // Return the renderer data with ID (include the renderer object for app use)
        return {
            id: docRef.id,
            name,
            renderer, // Return the object, not the JSON string
            createdAt: firestoreData.createdAt,
            userId: userData.uid,
            ...(image && { image }),
        };
    } catch (error) {
        console.error('Error saving renderer:', error);
        throw error;
    }
};

/**
 * Update a renderer with an image screenshot
 * Path: sentinel2-explorer/<userid>/renderers/<renderer_id>
 *
 * @param rendererId - The renderer document ID
 * @param image - Base64 data URL of the renderer screenshot
 * @param userId - The user ID from Firebase Auth
 * @returns Promise<void>
 */
export const updateRendererImage = async (
    rendererId: string,
    image: string,
    userId: string
): Promise<void> => {
    try {
        const app = getApp();
        const db = getFirestore(app);

        // Path: sentinel2-explorer/<userid>/renderers/<renderer_id>
        const rendererDocRef = doc(
            db,
            'sentinel2-explorer',
            userId,
            'renderers',
            rendererId
        );

        // Update the renderer with the image
        await setDoc(rendererDocRef, { image }, { merge: true });

        console.log('Renderer image updated successfully:', { rendererId });
    } catch (error) {
        console.error('Error updating renderer image:', error);
        throw error;
    }
};

/**
 * Fetch all renderers for a specific user
 * Path: sentinel2-explorer/<userid>/renderers
 *
 * @param userId - The user ID from Firebase Auth
 * @returns Promise<RendererData[]>
 */
export const fetchUserRenderers = async (
    userId: string
): Promise<RendererData[]> => {
    try {
        const app = getApp();
        const db = getFirestore(app);

        // Path: sentinel2-explorer/<userid>/renderers
        const userDocRef = doc(db, 'sentinel2-explorer', userId);
        const renderersCollectionRef = collection(userDocRef, 'renderers');
        const querySnapshot = await getDocs(renderersCollectionRef);

        const renderers: RendererData[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Parse the rendererJson string back to an object
            const renderer = data.rendererJson
                ? JSON.parse(data.rendererJson)
                : data.renderer; // Fallback for old data

            renderers.push({
                id: doc.id,
                ...data,
                renderer, // Use the parsed object
            } as RendererData);
        });

        console.log(`Fetched ${renderers.length} renderers for user ${userId}`);
        return renderers;
    } catch (error) {
        console.error('Error fetching user renderers:', error);
        throw error;
    }
};

/**
 * Delete a spatial bookmark from Firestore
 * Path: sentinel2-explorer/<userid>/bookmarks/<project>/items/<bookmark_id>
 *
 * @param projectName - The name of the project
 * @param bookmarkId - The ID of the bookmark to delete
 * @param userId - The user's ID
 * @returns Promise<void>
 */
export const deleteSpatialBookmark = async (
    projectName: string,
    bookmarkId: string,
    userId: string
): Promise<void> => {
    try {
        const app = getApp();
        const db = getFirestore(app);

        // Path: sentinel2-explorer/<userid>/bookmarks/<project>/items/<bookmark_id>
        const bookmarkDocRef = doc(
            db,
            'sentinel2-explorer',
            userId,
            'bookmarks',
            projectName,
            'items',
            bookmarkId
        );

        await deleteDoc(bookmarkDocRef);

        console.log('Bookmark deleted successfully:', {
            projectName,
            bookmarkId,
        });
    } catch (error) {
        console.error('Error deleting bookmark:', error);
        throw error;
    }
};

/**
 * Delete a renderer from Firestore
 * Path: sentinel2-explorer/<userid>/renderers/<renderer_id>
 *
 * @param rendererId - The ID of the renderer to delete
 * @param userId - The user's ID
 * @returns Promise<void>
 */
export const deleteRenderer = async (
    rendererId: string,
    userId: string
): Promise<void> => {
    try {
        const app = getApp();
        const db = getFirestore(app);

        // Path: sentinel2-explorer/<userid>/renderers/<renderer_id>
        const rendererDocRef = doc(
            db,
            'sentinel2-explorer',
            userId,
            'renderers',
            rendererId
        );

        await deleteDoc(rendererDocRef);

        console.log('Renderer deleted successfully:', { rendererId });
    } catch (error) {
        console.error('Error deleting renderer:', error);
        throw error;
    }
};
