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

import React, { useEffect, useRef, useCallback } from 'react';
import MapView from '@arcgis/core/views/MapView';
import MediaLayer from '@arcgis/core/layers/MediaLayer';
import ExtentAndRotationGeoreference from '@arcgis/core/layers/support/ExtentAndRotationGeoreference';
import ImageElement from '@arcgis/core/layers/support/ImageElement';
import MosaicRule from '@arcgis/core/layers/support/MosaicRule';

type Props = {
    mapView?: MapView;
    serviceUrl: string;
    rasterFunctionDefinition: object;
    mosaicRule: MosaicRule;
    visible: boolean;
    /**
     * Callback when loading state changes (for loading spinner integration)
     */
    onLoadingChange?: (isLoading: boolean) => void;
};

/**
 * Component that displays imagery with custom rendering rules by making direct HTTP requests
 * This bypasses the ArcGIS JS API's ImageryLayer which alphabetizes JSON properties,
 * allowing us to maintain the correct property order required by Esri ImageServer.
 */
export const CustomRendererImageOverlay: React.FC<Props> = ({
    mapView,
    serviceUrl,
    rasterFunctionDefinition,
    mosaicRule,
    visible,
    onLoadingChange,
}) => {
    const layerRef = useRef<MediaLayer>(null);
    const abortControllerRef = useRef<AbortController>(null);

    /**
     * Helper to create properly ordered JSON string for rendering rule
     */
    const createOrderedRenderingRuleString = (obj: any): string => {
        if (!obj || typeof obj !== 'object') {
            return JSON.stringify(obj);
        }

        if (Array.isArray(obj)) {
            return '[' + obj.map(item => createOrderedRenderingRuleString(item)).join(',') + ']';
        }

        const parts: string[] = [];

        // Add rasterFunction first if it exists
        if (obj.rasterFunction !== undefined) {
            parts.push(`"rasterFunction":"${obj.rasterFunction}"`);
        }

        // Add all other properties
        Object.keys(obj).forEach(key => {
            if (key === 'rasterFunction') return; // Already added

            const value = obj[key];
            if (typeof value === 'object') {
                parts.push(`"${key}":${createOrderedRenderingRuleString(value)}`);
            } else if (typeof value === 'string') {
                // Escape special characters in strings
                const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                parts.push(`"${key}":"${escaped}"`);
            } else {
                parts.push(`"${key}":${JSON.stringify(value)}`);
            }
        });

        return '{' + parts.join(',') + '}';
    };

    /**
     * Fetch image directly from ImageServer with properly ordered rendering rule
     */
    const fetchImage = useCallback(async () => {
        if (!mapView || !mosaicRule) {
            console.log('CustomRendererImageOverlay: Skip fetch - missing mapView or mosaicRule');
            return;
        }

        // Cancel previous request if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        const extent = mapView.extent;
        const width = mapView.width;
        const height = mapView.height;

        if (!extent || !width || !height) {
            console.log('CustomRendererImageOverlay: Skip fetch - missing extent or dimensions');
            return;
        }

        // Notify that loading has started
        if (onLoadingChange) {
            onLoadingChange(true);
        }

        // Create properly ordered rendering rule string
        const renderingRuleString = createOrderedRenderingRuleString(rasterFunctionDefinition);
        console.log('CustomRendererImageOverlay: Rendering rule (ordered):', renderingRuleString);

        // Build request parameters
        const params = new URLSearchParams({
            f: 'image',
            bbox: `${extent.xmin},${extent.ymin},${extent.xmax},${extent.ymax}`,
            bboxSR: extent.spatialReference.wkid.toString(),
            imageSR: extent.spatialReference.wkid.toString(),
            size: `${width},${height}`,
            format: 'png',
            mosaicRule: JSON.stringify(mosaicRule.toJSON()),
            renderingRule: renderingRuleString, // Our properly ordered JSON string
        });

        const requestURL = `${serviceUrl}/exportImage?${params.toString()}`;

        try {
            const response = await fetch(requestURL, {
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);

            // Create image element for MediaLayer
            const imageElement = new ImageElement({
                image: imageUrl,
                georeference: new ExtentAndRotationGeoreference({
                    extent: extent,
                }),
            });

            // Remove old layer if it exists
            if (layerRef.current) {
                mapView.map.remove(layerRef.current);
            }

            // Create new MediaLayer with the image
            layerRef.current = new MediaLayer({
                source: [imageElement],
                opacity: 1,
                visible,
            });
            mapView.map.add(layerRef.current);

            console.log('CustomRendererImageOverlay: Image updated successfully');

            // Wait for layer view to be created AND for mapView to finish updating
            // This ensures we don't mark loading as complete too early
            try {
                await mapView.whenLayerView(layerRef.current);
                console.log('CustomRendererImageOverlay: Layer view created');

                // Wait for mapView to finish updating before marking as complete
                // This prevents the spinner from flickering
                await new Promise<void>((resolve) => {
                    if (!mapView.updating) {
                        resolve();
                        return;
                    }

                    const handle = mapView.watch('updating', (updating) => {
                        if (!updating) {
                            handle.remove();
                            resolve();
                        }
                    });
                });
                console.log('CustomRendererImageOverlay: MapView finished updating');
            } catch (err) {
                console.warn('CustomRendererImageOverlay: Layer view creation warning:', err);
            }

            // Notify that loading has finished
            if (onLoadingChange) {
                onLoadingChange(false);
            }
        } catch (error: any) {
            // Notify that loading has finished (even on error)
            if (onLoadingChange) {
                onLoadingChange(false);
            }

            if (error.name === 'AbortError') {
                console.log('CustomRendererImageOverlay: Request aborted');
            } else {
                console.error('CustomRendererImageOverlay: Error fetching image:', error);
            }
        }
    }, [mapView, mosaicRule, rasterFunctionDefinition, serviceUrl, visible, onLoadingChange]);

    // Fetch image when extent changes or rendering rule changes
    useEffect(() => {
        if (!mapView || !visible) return;

        fetchImage();

        // Watch for extent changes
        const handle = mapView.watch('extent', () => {
            fetchImage();
        });

        return () => {
            handle.remove();
        };
    }, [mapView, visible, fetchImage]);

    // Update visibility
    useEffect(() => {
        if (layerRef.current) {
            layerRef.current.visible = visible;
        }
    }, [visible]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (layerRef.current) {
                mapView?.map.remove(layerRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return null;
};
