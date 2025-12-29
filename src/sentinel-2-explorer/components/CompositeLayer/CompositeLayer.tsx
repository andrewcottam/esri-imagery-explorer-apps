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

import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
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
import { selectPendingScreenshotRendererId } from '@shared/store/Renderers/selectors';
import { pendingScreenshotRendererIdSet } from '@shared/store/Renderers/reducer';
import { selectFirebaseUser } from '@shared/store/Firebase/selectors';
import MapView from '@arcgis/core/views/MapView';
import { captureMapScreenshot } from '@shared/utils/captureMapScreenshot';
import { updateRendererImage } from '@shared/services/firebase/firestore';

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

    const layerRef = useRef<ImageryLayer>(null);
    const [layer, setLayer] = useState<ImageryLayer>(null);

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

    // Initialize the imagery layer when we should show the composite
    useEffect(() => {
        if (
            showCompositeLayer &&
            compositeMosaicRule &&
            queryParams.rasterFunctionName
        ) {
            if (!layerRef.current) {
                // Use full raster function definition if available, otherwise just the function name
                const rasterFunctionConfig = queryParams.rasterFunctionDefinition
                    ? queryParams.rasterFunctionDefinition
                    : { functionName: queryParams.rasterFunctionName };

                layerRef.current = new ImageryLayer({
                    url: SENTINEL_2_SERVICE_URL,
                    mosaicRule: compositeMosaicRule,
                    rasterFunction: rasterFunctionConfig,
                    visible: true,
                });
                setLayer(layerRef.current);
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
    ]);

    // Update mosaic rule when composite settings change
    useEffect(() => {
        if (layerRef.current && compositeMosaicRule) {
            layerRef.current.mosaicRule = compositeMosaicRule;
        }
    }, [compositeMosaicRule]);

    // Update raster function when it changes
    useEffect(() => {
        if (layerRef.current && queryParams.rasterFunctionName) {
            // Use full raster function definition if available, otherwise just the function name
            const rasterFunctionConfig = queryParams.rasterFunctionDefinition
                ? queryParams.rasterFunctionDefinition
                : { functionName: queryParams.rasterFunctionName };

            layerRef.current.rasterFunction = rasterFunctionConfig as any;
        }
    }, [queryParams.rasterFunctionName, queryParams.rasterFunctionDefinition]);

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
            return;
        }

        // Wait for layer to finish rendering
        const handleLayerUpdate = async () => {
            try {
                // Wait for layer to be loaded and stop updating
                await layer.when();

                // Wait a bit longer for the view to finish rendering
                await mapView.when();

                // Add a small delay to ensure rendering is complete
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // Capture screenshot
                const image = await captureMapScreenshot(mapView);

                // Update renderer in Firestore
                await updateRendererImage(
                    pendingScreenshotRendererId,
                    image,
                    firebaseUser.uid
                );

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

    return null;
};
