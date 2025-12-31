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

import React, { useEffect, useRef, useState } from 'react';
import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import MosaicRule from '@arcgis/core/layers/support/MosaicRule';

/**
 * Ensures rasterFunction properties come before rasterFunctionArguments
 * in the object tree to match Esri's expected property order
 */
const normalizeRasterFunctionOrder = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return obj;
    }

    const normalized: any = {};

    // Always put rasterFunction first if it exists
    if (obj.rasterFunction !== undefined) {
        normalized.rasterFunction = obj.rasterFunction;
    }

    // Then add other properties (recursively normalizing nested objects)
    for (const key in obj) {
        if (key === 'rasterFunction') continue; // Already added

        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            normalized[key] = normalizeRasterFunctionOrder(obj[key]);
        } else if (Array.isArray(obj[key])) {
            normalized[key] = obj[key].map((item: any) => normalizeRasterFunctionOrder(item));
        } else {
            normalized[key] = obj[key];
        }
    }

    return normalized;
};

type Props = {
    /**
     * service url
     */
    url: string;
    /**
     * name of selected raster function that will be used to render the imagery layer
     */
    rasterFunction: string;
    /**
     * Full raster function definition (for custom renderers with arguments)
     * This is the complete JSON object that includes rasterFunction and rasterFunctionArguments
     */
    rasterFunctionDefinition?: object;
    /**
     * object id of the selected scene
     */
    objectId?: number;
    /**
     * visibility of the imagery layer
     */
    visible?: boolean;
    /**
     * the mosaic rule that will be used to render the imagery layer in Dynamic mode
     */
    defaultMosaicRule?: MosaicRule;
};

/**
 * Get the mosaic rule that will be used to define how the Imagery images should be mosaicked.
 * @param objectId - object id of the selected Imagery scene
 * @returns A Promise that resolves to an IMosaicRule object representing the mosaic rule.
 *
 * @see https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-support-MosaicRule.html
 */
export const getLockRasterMosaicRule = (objectId: number): MosaicRule => {
    if (!objectId) {
        return null;
    }

    // {"mosaicMethod":"esriMosaicLockRaster","where":"objectid in (2969545)","ascending":false,"lockRasterIds":[2969545]}
    return new MosaicRule({
        method: 'lock-raster',
        ascending: false,
        where: `objectid in (${objectId})`,
        lockRasterIds: [objectId],
    });
};

/**
 * A custom React hook that returns an Imagery Layer instance .
 * The hook also updates the Imagery Layer when the input parameters are changed.
 *
 * @returns {IImageryLayer} - The Imagery Layer.
 */
export const useImageryLayerByObjectId = ({
    url,
    visible,
    rasterFunction,
    rasterFunctionDefinition,
    objectId,
    defaultMosaicRule,
}: Props) => {
    const layerRef = useRef<ImageryLayer>(null);

    const [layer, setLayer] = useState<ImageryLayer>();

    /**
     * initialize imagery layer using mosaic created using the input year
     */
    const init = async () => {
        const mosaicRule = objectId
            ? getLockRasterMosaicRule(objectId)
            : defaultMosaicRule;

        // Use full raster function definition if available, otherwise just the function name
        let rasterFunctionConfig = rasterFunctionDefinition
            ? rasterFunctionDefinition
            : { functionName: rasterFunction };

        // Normalize property ordering for custom renderers to ensure rasterFunction comes before rasterFunctionArguments
        if (rasterFunctionDefinition) {
            rasterFunctionConfig = normalizeRasterFunctionOrder(rasterFunctionConfig);
            console.log('Using custom raster function definition (normalized):');
            console.log('JSON stringified:', JSON.stringify(rasterFunctionConfig, null, 2));
        }

        layerRef.current = new ImageryLayer({
            // URL to the imagery service
            url,
            mosaicRule,
            rasterFunction: rasterFunctionConfig,
            visible,
            // blendMode: 'multiply'
        });

        setLayer(layerRef.current);
    };

    useEffect(() => {
        if (!layerRef.current) {
            init();
        } else {
            // layerRef.current.mosaicRule = createMosaicRuleByYear(
            //     year,
            //     aquisitionMonth
            // ) as any;
        }
    }, []);

    useEffect(() => {
        if (!layerRef.current) {
            return;
        }

        // Use full raster function definition if available, otherwise just the function name
        let rasterFunctionConfig = rasterFunctionDefinition
            ? rasterFunctionDefinition
            : { functionName: rasterFunction };

        // Normalize property ordering for custom renderers to ensure rasterFunction comes before rasterFunctionArguments
        if (rasterFunctionDefinition) {
            rasterFunctionConfig = normalizeRasterFunctionOrder(rasterFunctionConfig);
        }

        layerRef.current.rasterFunction = rasterFunctionConfig as any;
    }, [rasterFunction, rasterFunctionDefinition]);

    useEffect(() => {
        (async () => {
            if (!layerRef.current) {
                return;
            }

            layerRef.current.mosaicRule = objectId
                ? getLockRasterMosaicRule(objectId)
                : defaultMosaicRule;
        })();
    }, [objectId]);

    useEffect(() => {
        if (!layerRef.current) {
            return;
        }

        layerRef.current.visible = visible;
    }, [visible]);

    return layer;
};
