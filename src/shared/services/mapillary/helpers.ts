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

import Point from '@arcgis/core/geometry/Point';
import * as projection from '@arcgis/core/geometry/projection';
import SpatialReference from '@arcgis/core/geometry/SpatialReference';
import { MAPILLARY_CLIENT_TOKEN, MAPILLARY_GRAPH_API, MAPILLARY_VIEWER_URL } from './config';

export type MapillaryImage = {
    id: string;
    geometry: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };
    computed_geometry?: {
        type: 'Point';
        coordinates: [number, number];
    };
    compass_angle?: number;
    captured_at: number;
    sequence?: string;
};

/**
 * Query Mapillary API for images near a point
 * @param point - Map point (will be projected to WGS84 if needed)
 * @param radiusMeters - Search radius in meters (default: 100m)
 * @returns Array of Mapillary images
 */
export const queryMapillaryImages = async (
    point: Point,
    radiusMeters: number = 100
): Promise<MapillaryImage[]> => {
    try {
        // Ensure point is in WGS84 (latitude/longitude)
        let wgs84Point = point;
        if (point.spatialReference.wkid !== 4326) {
            await projection.load();
            wgs84Point = projection.project(
                point,
                SpatialReference.WGS84
            ) as Point;
        }

        const { longitude, latitude } = wgs84Point;

        // Calculate bounding box for search (approximate meters to degrees)
        const metersPerDegree = 111320; // at equator
        const deltaLat = radiusMeters / metersPerDegree;
        const deltaLon = radiusMeters / (metersPerDegree * Math.cos((latitude * Math.PI) / 180));

        const bbox = [
            longitude - deltaLon,
            latitude - deltaLat,
            longitude + deltaLon,
            latitude + deltaLat,
        ].join(',');

        // Query Mapillary API
        const url = new URL(`${MAPILLARY_GRAPH_API}/images`);
        url.searchParams.append('access_token', MAPILLARY_CLIENT_TOKEN);
        url.searchParams.append('bbox', bbox);
        url.searchParams.append('limit', '10');
        url.searchParams.append(
            'fields',
            'id,geometry,computed_geometry,compass_angle,captured_at,sequence'
        );

        const response = await fetch(url.toString());

        if (!response.ok) {
            console.error('Mapillary API error:', response.statusText);
            return [];
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error querying Mapillary images:', error);
        return [];
    }
};

/**
 * Get the closest Mapillary image to a point
 * @param point - Map point
 * @param radiusMeters - Search radius in meters
 * @returns Closest Mapillary image or null
 */
export const getClosestMapillaryImage = async (
    point: Point,
    radiusMeters: number = 100
): Promise<MapillaryImage | null> => {
    const images = await queryMapillaryImages(point, radiusMeters);

    if (images.length === 0) {
        return null;
    }

    // Find closest image
    let wgs84Point = point;
    if (point.spatialReference.wkid !== 4326) {
        await projection.load();
        wgs84Point = projection.project(point, SpatialReference.WGS84) as Point;
    }

    const { longitude, latitude } = wgs84Point;

    let closestImage = images[0];
    let minDistance = Number.MAX_VALUE;

    for (const image of images) {
        const coords = image.computed_geometry?.coordinates || image.geometry.coordinates;
        const dx = coords[0] - longitude;
        const dy = coords[1] - latitude;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
            minDistance = distance;
            closestImage = image;
        }
    }

    return closestImage;
};

/**
 * Get thumbnail URL for a Mapillary image
 * @param imageId - Mapillary image ID
 * @param size - Thumbnail size (320, 640, 1024, or 2048)
 * @returns Thumbnail URL
 */
export const getMapillaryThumbnailUrl = (imageId: string, size: 320 | 640 | 1024 | 2048 = 640): string => {
    return `https://images.mapillary.com/${imageId}/thumb-${size}.jpg`;
};

/**
 * Get Mapillary viewer URL for a specific image
 * @param imageId - Mapillary image ID
 * @returns Viewer URL
 */
export const getMapillaryViewerUrl = (imageId: string): string => {
    return `${MAPILLARY_VIEWER_URL}/?focus=photo&pKey=${imageId}`;
};

/**
 * Open Mapillary viewer for a specific image
 * @param imageId - Mapillary image ID
 * @param newWindow - Whether to open in a new window (default: true)
 */
export const openMapillaryViewer = (imageId: string, newWindow: boolean = true): void => {
    const url = getMapillaryViewerUrl(imageId);

    if (newWindow) {
        window.open(url, '_blank', 'noopener,noreferrer');
    } else {
        window.location.href = url;
    }
};

/**
 * Open Mapillary viewer at a specific location
 * @param point - Map point (will be projected to WGS84 if needed)
 * @param radiusMeters - Search radius for finding images
 */
export const openMapillaryAtLocation = async (
    point: Point,
    radiusMeters: number = 100
): Promise<boolean> => {
    const image = await getClosestMapillaryImage(point, radiusMeters);

    if (!image) {
        console.log('No Mapillary imagery found at this location');
        return false;
    }

    openMapillaryViewer(image.id);
    return true;
};
