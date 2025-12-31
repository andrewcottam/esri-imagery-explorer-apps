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
import React, { FC, useEffect } from 'react';
import { useImageryLayerByObjectId, getLockRasterMosaicRule } from './useImageLayer';
import { CustomRendererImageOverlay } from './CustomRendererImageOverlay';
import { useAppDispatch, useAppSelector } from '@shared/store/configureStore';
import {
    selectQueryParams4SceneInSelectedMode,
    selectAppMode,
    selectActiveAnalysisTool,
} from '@shared/store/ImageryScene/selectors';
import { selectAnimationStatus } from '@shared/store/UI/selectors';
import GroupLayer from '@arcgis/core/layers/GroupLayer';
import { selectChangeCompareLayerIsOn } from '@shared/store/ChangeCompareTool/selectors';
import { selectIsTemporalCompositeLayerOn } from '@shared/store/TemporalCompositeTool/selectors';
import MosaicRule from '@arcgis/core/layers/support/MosaicRule';
import { selectPendingScreenshotRendererId } from '@shared/store/Renderers/selectors';
import {
    pendingScreenshotRendererIdSet,
    customRendererImageUpdated,
} from '@shared/store/Renderers/reducer';
import { selectFirebaseUser } from '@shared/store/Firebase/selectors';
import { captureMapScreenshot } from '@shared/utils/captureMapScreenshot';
import { updateRendererImage } from '@shared/services/firebase/firestore';

type Props = {
    serviceUrl: string;
    mapView?: MapView;
    groupLayer?: GroupLayer;
    /**
     * the mosaic rule that will be used for the imagery layer in Dynamic mode
     */
    defaultMosaicRule: MosaicRule;
};

const ImageryLayerByObjectID: FC<Props> = ({
    serviceUrl,
    mapView,
    groupLayer,
    defaultMosaicRule,
}: Props) => {
    const dispatch = useAppDispatch();
    const mode = useAppSelector(selectAppMode);

    const {
        rasterFunctionName,
        rasterFunctionDefinition,
        objectIdOfSelectedScene,
    } = useAppSelector(selectQueryParams4SceneInSelectedMode) || {};

    const animationStatus = useAppSelector(selectAnimationStatus);

    const analysisTool = useAppSelector(selectActiveAnalysisTool);

    const changeCompareLayerIsOn = useAppSelector(selectChangeCompareLayerIsOn);

    const isTemporalCompositeLayerOn = useAppSelector(
        selectIsTemporalCompositeLayerOn
    );

    const pendingScreenshotRendererId = useAppSelector(
        selectPendingScreenshotRendererId
    );

    const firebaseUser = useAppSelector(selectFirebaseUser);

    const getVisibility = () => {
        if (mode === 'dynamic') {
            return true;
        }

        if (mode === 'find a scene' || mode === 'spectral sampling') {
            return objectIdOfSelectedScene !== null;
        }

        if (mode === 'analysis') {
            // no need to show imagery layer when user is viewing change layer in the change compare tool
            if (analysisTool === 'change' && changeCompareLayerIsOn) {
                return false;
            }

            // no need to show imagery layer when user is using the 'temporal composite' tool
            if (analysisTool === 'temporal composite') {
                return false;
            }

            return objectIdOfSelectedScene !== null;
        }

        // when in animate mode, only need to show landsat layer if animation is not playing
        if (
            mode === 'animate' &&
            objectIdOfSelectedScene &&
            animationStatus === null
        ) {
            return true;
        }

        return false;
    };

    const getObjectId = () => {
        // should ignore the object id of selected scene if in dynamic mode,
        if (mode === 'dynamic') {
            return null;
        }

        return objectIdOfSelectedScene;
    };

    // Use custom overlay for complex renderers, regular ImageryLayer for built-in renderers
    const useCustomOverlay = rasterFunctionDefinition !== undefined && rasterFunctionDefinition !== null;

    // Only create regular layer if NOT using custom overlay
    const layer = useCustomOverlay
        ? null
        : useImageryLayerByObjectId({
              url: serviceUrl,
              visible: getVisibility(),
              rasterFunction: rasterFunctionName,
              rasterFunctionDefinition,
              objectId: getObjectId(),
              defaultMosaicRule,
          });

    useEffect(() => {
        if (groupLayer && layer && !useCustomOverlay) {
            groupLayer.add(layer);
            groupLayer.reorder(layer, 0);
        }
    }, [groupLayer, layer, useCustomOverlay]);

    // Capture screenshot for custom renderer after layer renders
    useEffect(() => {
        if (
            !pendingScreenshotRendererId ||
            !layer ||
            !mapView ||
            !firebaseUser
        ) {
            console.log('ImageryLayerByObjectID: Screenshot capture skipped:', {
                hasPendingId: !!pendingScreenshotRendererId,
                hasLayer: !!layer,
                hasMapView: !!mapView,
                hasUser: !!firebaseUser,
            });
            return;
        }

        console.log(
            'ImageryLayerByObjectID: Starting screenshot capture for renderer:',
            pendingScreenshotRendererId
        );

        // Wait for layer to finish rendering
        const handleLayerUpdate = async () => {
            try {
                console.log('ImageryLayerByObjectID: Waiting for layer to load...');
                // Wait for layer to be loaded and stop updating
                await layer.when();
                console.log('ImageryLayerByObjectID: Layer loaded');

                console.log('ImageryLayerByObjectID: Waiting for map view...');
                // Wait a bit longer for the view to finish rendering
                await mapView.when();
                console.log('ImageryLayerByObjectID: Map view ready');

                // Add a small delay to ensure rendering is complete
                console.log('ImageryLayerByObjectID: Waiting 1 second for rendering to complete...');
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // Capture screenshot
                console.log('ImageryLayerByObjectID: Capturing screenshot...');
                const image = await captureMapScreenshot(mapView);
                console.log('ImageryLayerByObjectID: Screenshot captured, size:', image.length);

                // Update renderer in Firestore
                console.log(
                    'ImageryLayerByObjectID: Updating renderer image in Firestore:',
                    pendingScreenshotRendererId
                );
                await updateRendererImage(
                    pendingScreenshotRendererId,
                    image,
                    firebaseUser.uid
                );
                console.log('ImageryLayerByObjectID: Firestore updated successfully');

                // Update Redux state with the new image
                dispatch(
                    customRendererImageUpdated({
                        rendererId: pendingScreenshotRendererId,
                        image,
                    })
                );
                console.log('ImageryLayerByObjectID: Redux state updated');

                console.log('ImageryLayerByObjectID: Renderer screenshot captured and saved');

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

    // Render custom overlay for complex renderers
    if (useCustomOverlay && rasterFunctionDefinition) {
        const mosaicRule = getObjectId()
            ? getLockRasterMosaicRule(getObjectId())
            : defaultMosaicRule;

        return (
            <CustomRendererImageOverlay
                mapView={mapView}
                serviceUrl={serviceUrl}
                rasterFunctionDefinition={rasterFunctionDefinition}
                mosaicRule={mosaicRule}
                visible={getVisibility()}
            />
        );
    }

    return null;
};

export default ImageryLayerByObjectID;
