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

import React, { FC, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@shared/store/configureStore';
import {
    selectCompositeSceneIds,
    selectCompositeMethod,
    selectShowCompositeLayer,
    selectQueryParams4MainScene,
} from '@shared/store/ImageryScene/selectors';
import { SENTINEL_2_SERVICE_URL } from '@shared/services/sentinel-2/config';
import MosaicRule from '@arcgis/core/layers/support/MosaicRule';
import GroupLayer from '@arcgis/core/layers/GroupLayer';
import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import MediaLayer from '@arcgis/core/layers/MediaLayer';
import ImageElement from '@arcgis/core/layers/support/ImageElement';
import ExtentAndRotationGeoreference from '@arcgis/core/layers/support/ExtentAndRotationGeoreference';
import { selectPendingScreenshotRendererId } from '@shared/store/Renderers/selectors';
import {
    pendingScreenshotRendererIdSet,
    customRendererImageUpdated,
} from '@shared/store/Renderers/reducer';
import { selectFirebaseUser } from '@shared/store/Firebase/selectors';
import MapView from '@arcgis/core/views/MapView';
import { captureMapScreenshot } from '@shared/utils/captureMapScreenshot';
import { updateRendererImage } from '@shared/services/firebase/firestore';
import { exportCompositeImageWithCustomRenderer } from '@shared/services/helpers/exportImage';

type Props = {
    groupLayer?: GroupLayer;
    mapView?: MapView;
};

/**
 * CompositeLayer component renders an imagery layer with multiple scenes
 * composited together using the specified mosaic operation
 */
export const CompositeLayer: FC<Props> = ({ groupLayer, mapView }) => {
    const dispatch = useAppDispatch();
    const compositeSceneIds = useAppSelector(selectCompositeSceneIds);
    const compositeMethod = useAppSelector(selectCompositeMethod);
    const showCompositeLayer = useAppSelector(selectShowCompositeLayer);
    const queryParams = useAppSelector(selectQueryParams4MainScene);
    const pendingScreenshotRendererId = useAppSelector(
        selectPendingScreenshotRendererId
    );
    const firebaseUser = useAppSelector(selectFirebaseUser);

    const layerRef = useRef<ImageryLayer | MediaLayer>(null);
    const [layer, setLayer] = useState<ImageryLayer | MediaLayer>(null);
    const abortControllerRef = useRef<AbortController>(null);
    const blobUrlsRef = useRef<string[]>([]);

    // Debug: Log when layer state changes
    useEffect(() => {
        console.log('Layer state changed:', !!layer);
    }, [layer]);

    // Check if using custom renderer
    const isCustomRenderer = useMemo(() => {
        return (
            queryParams.rasterFunctionDefinition !== undefined &&
            queryParams.rasterFunctionDefinition !== null
        );
    }, [queryParams.rasterFunctionDefinition]);

    // Create mosaic rule for composite
    const compositeMosaicRule = useMemo(() => {
        if (!compositeSceneIds || compositeSceneIds.length === 0) {
            return null;
        }

        return new MosaicRule({
            method: 'lock-raster',
            ascending: false,
            lockRasterIds: compositeSceneIds,
            operation: compositeMethod, // Use the method directly (first, last, min, max, mean, blend, sum)
            where: `objectid in (${compositeSceneIds.join(',')})`,
        });
    }, [compositeSceneIds, compositeMethod]);

    // Function to create custom renderer composite layer using direct HTTP request
    const createCustomRendererLayer = useCallback(async () => {
        console.log('CompositeLayer: createCustomRendererLayer called', {
            hasMapView: !!mapView,
            hasCompositeSceneIds: !!compositeSceneIds,
            compositeSceneIds,
            hasRasterFunctionDefinition: !!queryParams.rasterFunctionDefinition,
            rasterFunctionDefinition: queryParams.rasterFunctionDefinition,
        });

        if (!mapView || !compositeSceneIds || !queryParams.rasterFunctionDefinition) {
            console.log('CompositeLayer: Early return from createCustomRendererLayer', {
                mapView: !!mapView,
                compositeSceneIds: !!compositeSceneIds,
                rasterFunctionDefinition: !!queryParams.rasterFunctionDefinition,
            });
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
            console.log('CompositeLayer: Skip fetch - missing extent or dimensions');
            return;
        }

        try {
            console.log('CompositeLayer: Fetching custom renderer composite image...');
            const blob = await exportCompositeImageWithCustomRenderer({
                serviceUrl: SENTINEL_2_SERVICE_URL,
                extent,
                width,
                height,
                rasterFunctionDefinition: queryParams.rasterFunctionDefinition,
                objectIds: compositeSceneIds,
                method: compositeMethod,
                abortController: abortControllerRef.current,
            });

            const imageUrl = URL.createObjectURL(blob);
            blobUrlsRef.current.push(imageUrl);

            // Wait for image to load
            await new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = imageUrl;
            });

            const imageElement = new ImageElement({
                image: imageUrl,
                georeference: new ExtentAndRotationGeoreference({
                    extent: extent,
                }),
            });

            // Remove old layer if it exists
            if (layerRef.current && groupLayer) {
                groupLayer.remove(layerRef.current);
            }

            // Create new MediaLayer
            layerRef.current = new MediaLayer({
                source: [imageElement],
                opacity: 1,
                visible: true,
            });

            console.log('CompositeLayer: Custom renderer MediaLayer created');
            setLayer(layerRef.current);
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('CompositeLayer: Request aborted');
            } else {
                console.error('CompositeLayer: Error fetching custom renderer composite:', error);
            }
        }
    }, [mapView, compositeSceneIds, queryParams.rasterFunctionDefinition, compositeMethod, groupLayer]);

    // Initialize the imagery layer when we should show the composite
    useEffect(() => {
        console.log('Layer initialization effect running:', {
            showCompositeLayer,
            hasMosaicRule: !!compositeMosaicRule,
            rasterFunctionName: queryParams.rasterFunctionName,
            isCustomRenderer,
        });

        if (
            showCompositeLayer &&
            compositeMosaicRule &&
            queryParams.rasterFunctionName
        ) {
            console.log('Creating new layer...');
            // Always recreate the layer when renderer changes
            if (layerRef.current && groupLayer) {
                console.log('Removing old layer');
                groupLayer.remove(layerRef.current);
                layerRef.current = null;
            }

            if (isCustomRenderer) {
                // For custom renderers, use direct HTTP request with MediaLayer
                console.log('Using custom renderer with MediaLayer');
                createCustomRendererLayer();
            } else {
                // For regular renderers, use ImageryLayer
                const rasterFunctionConfig = { functionName: queryParams.rasterFunctionName };
                console.log('Raster function config:', rasterFunctionConfig);

                layerRef.current = new ImageryLayer({
                    url: SENTINEL_2_SERVICE_URL,
                    mosaicRule: compositeMosaicRule,
                    rasterFunction: rasterFunctionConfig,
                    visible: true,
                });
                console.log('Layer created, calling setLayer');
                setLayer(layerRef.current);
                console.log('setLayer called');
            }
        } else {
            // Clean up layer when we shouldn't show composite
            if (layerRef.current && groupLayer) {
                groupLayer.remove(layerRef.current);
                layerRef.current = null;
                setLayer(null);
            }
        }
    }, [
        showCompositeLayer,
        compositeMosaicRule,
        queryParams.rasterFunctionName,
        queryParams.rasterFunctionDefinition,
        groupLayer,
        isCustomRenderer,
        createCustomRendererLayer,
    ]);

    // Add layer to group when it's created
    useEffect(() => {
        if (groupLayer && layer) {
            groupLayer.add(layer);
        }
    }, [groupLayer, layer]);

    // Capture screenshot for custom renderer after layer renders
    useEffect(() => {
        if (
            !pendingScreenshotRendererId ||
            !layer ||
            !mapView ||
            !firebaseUser
        ) {
            console.log('Screenshot capture skipped:', {
                hasPendingId: !!pendingScreenshotRendererId,
                hasLayer: !!layer,
                hasMapView: !!mapView,
                hasUser: !!firebaseUser,
            });
            return;
        }

        console.log(
            'Starting screenshot capture for renderer:',
            pendingScreenshotRendererId
        );

        // Wait for layer to finish rendering
        const handleLayerUpdate = async () => {
            try {
                console.log('Waiting for layer to load...');
                // Wait for layer to be loaded and stop updating
                await layer.when();
                console.log('Layer loaded');

                console.log('Waiting for map view...');
                // Wait a bit longer for the view to finish rendering
                await mapView.when();
                console.log('Map view ready');

                // Add a small delay to ensure rendering is complete
                console.log('Waiting 1 second for rendering to complete...');
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // Capture screenshot
                console.log('Capturing screenshot...');
                const image = await captureMapScreenshot(mapView);
                console.log('Screenshot captured, size:', image.length);

                // Update renderer in Firestore
                console.log(
                    'Updating renderer image in Firestore:',
                    pendingScreenshotRendererId
                );
                await updateRendererImage(
                    pendingScreenshotRendererId,
                    image,
                    firebaseUser.uid
                );
                console.log('Firestore updated successfully');

                // Update Redux state with the new image
                dispatch(
                    customRendererImageUpdated({
                        rendererId: pendingScreenshotRendererId,
                        image,
                    })
                );
                console.log('Redux state updated');

                console.log('Renderer screenshot captured and saved');

                // Clear pending screenshot renderer ID
                dispatch(pendingScreenshotRendererIdSet(null));
            } catch (error) {
                console.error('Failed to capture renderer screenshot:', error);
                // Still clear the pending ID to avoid infinite retries
                dispatch(pendingScreenshotRendererIdSet(null));
            }
        };

        handleLayerUpdate();
    }, [pendingScreenshotRendererId, layer, mapView, firebaseUser, dispatch]);

    // Watch for extent changes to refetch custom renderer composites
    useEffect(() => {
        if (!mapView || !isCustomRenderer || !showCompositeLayer) {
            return;
        }

        const handle = mapView.watch('extent', () => {
            createCustomRendererLayer();
        });

        return () => {
            handle.remove();
        };
    }, [mapView, isCustomRenderer, showCompositeLayer, createCustomRendererLayer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            // Revoke all blob URLs to free up memory
            blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
            blobUrlsRef.current = [];
        };
    }, []);

    return null;
};
