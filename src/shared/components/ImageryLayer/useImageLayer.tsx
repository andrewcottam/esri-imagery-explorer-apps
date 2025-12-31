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
                parts.push(`"${key}":"${value}"`);
            } else {
                parts.push(`"${key}":${JSON.stringify(value)}`);
            }
        });

        return '{' + parts.join(',') + '}';
    };

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

        let customParameters: any = undefined;

        if (rasterFunctionDefinition) {
            // Create properly ordered JSON string
            const renderingRuleString = createOrderedRenderingRuleString(rasterFunctionDefinition);
            console.log('Rendering rule string (ordered):', renderingRuleString);

            // Try using customParameters to append renderingRule to all requests
            customParameters = {
                renderingRule: renderingRuleString
            };

            console.log('Using customParameters:', customParameters);
        }

        layerRef.current = new ImageryLayer({
            url,
            mosaicRule,
            rasterFunction: rasterFunctionConfig,
            ...(customParameters && { customParameters }),
            visible,
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

        // Convert custom renderers to use RasterFunction class
        if (rasterFunctionDefinition) {
            rasterFunctionConfig = convertToRasterFunction(rasterFunctionConfig);
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
