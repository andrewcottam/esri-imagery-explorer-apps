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

import MapView from '@arcgis/core/views/MapView';

/**
 * Captures a screenshot of the current map view and returns it as a base64 data URL
 * @param mapView - The ArcGIS MapView instance
 * @param width - Desired width of the screenshot (default: 384, which is 4x the card width)
 * @param height - Desired height of the screenshot (default: 192, which is 4x the card height)
 * @returns Promise<string> - Base64 data URL of the screenshot
 */
export const captureMapScreenshot = async (
    mapView: MapView,
    width: number = 384,
    height: number = 192
): Promise<string> => {
    if (!mapView) {
        throw new Error('MapView is not available');
    }

    try {
        // Take screenshot at higher resolution for better quality
        const screenshot = await mapView.takeScreenshot({
            width,
            height,
            format: 'png',
            quality: 90,
        });

        // Return the data URL
        return screenshot.dataUrl;
    } catch (error) {
        console.error('Error capturing map screenshot:', error);
        throw error;
    }
};
