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
import { useAppSelector } from '@shared/store/configureStore';
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

type Props = {
    groupLayer?: GroupLayer;
};

/**
 * CompositeLayer component renders an imagery layer with multiple scenes
 * composited together using the specified mosaic operation
 */
export const CompositeLayer: FC<Props> = ({ groupLayer }) => {
    const compositeSceneIds = useAppSelector(selectCompositeSceneIds);
    const compositeMethod = useAppSelector(selectCompositeMethod);
    const showCompositeLayer = useAppSelector(selectShowCompositeLayer);
    const queryParams = useAppSelector(selectQueryParams4MainScene);

    const layerRef = useRef<ImageryLayer>(null);
    const [layer, setLayer] = useState<ImageryLayer>(null);

    // Map composite method to ArcGIS mosaic operation
    const mosaicOperationMap = {
        first: 'MT_FIRST',
        last: 'MT_LAST',
        min: 'MT_MIN',
        max: 'MT_MAX',
        mean: 'MT_MEAN',
        blend: 'MT_BLEND',
        sum: 'MT_SUM',
    };

    // Create mosaic rule for composite
    const compositeMosaicRule = useMemo(() => {
        if (!compositeSceneIds || compositeSceneIds.length === 0) {
            return null;
        }

        return new MosaicRule({
            method: 'lock-raster',
            ascending: false,
            lockRasterIds: compositeSceneIds,
            mosaicOperation: mosaicOperationMap[compositeMethod],
            where: `objectid in (${compositeSceneIds.join(',')})`,
        });
    }, [compositeSceneIds, compositeMethod]);

    // Initialize the imagery layer when we should show the composite
    useEffect(() => {
        if (showCompositeLayer && compositeMosaicRule && queryParams.rasterFunctionName) {
            if (!layerRef.current) {
                layerRef.current = new ImageryLayer({
                    url: SENTINEL_2_SERVICE_URL,
                    mosaicRule: compositeMosaicRule,
                    rasterFunction: {
                        functionName: queryParams.rasterFunctionName,
                    },
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
    }, [showCompositeLayer, compositeMosaicRule, queryParams.rasterFunctionName]);

    // Update mosaic rule when composite settings change
    useEffect(() => {
        if (layerRef.current && compositeMosaicRule) {
            layerRef.current.mosaicRule = compositeMosaicRule;
        }
    }, [compositeMosaicRule]);

    // Update raster function when it changes
    useEffect(() => {
        if (layerRef.current && queryParams.rasterFunctionName) {
            layerRef.current.rasterFunction = {
                functionName: queryParams.rasterFunctionName,
            } as any;
        }
    }, [queryParams.rasterFunctionName]);

    // Add layer to group when it's created
    useEffect(() => {
        if (groupLayer && layer) {
            groupLayer.add(layer);
        }
    }, [groupLayer, layer]);

    return null;
};
