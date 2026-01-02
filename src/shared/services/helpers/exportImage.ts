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

import IExtent from '@arcgis/core/geometry/Extent';
import { getLockRasterMosaicRule, getCompositeMosaicRule } from './getMosaicRules';

/**
 * Helper to create properly ordered JSON string for rendering rule
 * This ensures rasterFunction appears first in the JSON, which is required by Esri ImageServer
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

type ExportImageParams = {
    /**
     * imagery service URL
     */
    serviceUrl: string;
    /**
     * Map Extent
     */
    extent: Pick<IExtent, 'xmin' | 'ymin' | 'xmax' | 'ymax'>;
    /**
     * width of map container
     */
    width: number;
    /**
     * height of map container
     */
    height: number;
    /**
     * raster function name that will be used in the rendering rule
     */
    rasterFunctionName: string;
    /**
     * object Id of the imagery scene
     */
    objectId: number;
    abortController: AbortController;
};

export const exportImage = async ({
    serviceUrl,
    extent,
    width,
    height,
    rasterFunctionName,
    objectId,
    abortController,
}: ExportImageParams) => {
    const { xmin, xmax, ymin, ymax } = extent;

    const params = new URLSearchParams({
        f: 'image',
        bbox: `${xmin},${ymin},${xmax},${ymax}`,
        bboxSR: '102100',
        imageSR: '102100',
        format: 'jpgpng',
        size: `${width},${height}`,
        mosaicRule: JSON.stringify(getLockRasterMosaicRule([objectId])),
        renderingRule: JSON.stringify({ rasterFunction: rasterFunctionName }),
    });

    const requestURL = `${serviceUrl}/exportImage?${params.toString()}`;

    const res = await fetch(requestURL, { signal: abortController.signal });

    const blob = await res.blob();

    return blob;
};

type ExportCompositeImageWithCustomRendererParams = {
    /**
     * imagery service URL
     */
    serviceUrl: string;
    /**
     * Map Extent
     */
    extent: Pick<IExtent, 'xmin' | 'ymin' | 'xmax' | 'ymax'>;
    /**
     * width of map container
     */
    width: number;
    /**
     * height of map container
     */
    height: number;
    /**
     * Full raster function definition (for custom renderers)
     */
    rasterFunctionDefinition: object;
    /**
     * object IDs of the imagery scenes to composite
     */
    objectIds: number[];
    /**
     * Composite method (maps to ArcGIS mosaic operations)
     */
    method: 'first' | 'last' | 'min' | 'max' | 'mean' | 'blend' | 'sum';
    abortController: AbortController;
};

/**
 * Export composite image with custom renderer definition
 * Uses properly ordered JSON to maintain rasterFunction property order required by Esri ImageServer
 */
export const exportCompositeImageWithCustomRenderer = async ({
    serviceUrl,
    extent,
    width,
    height,
    rasterFunctionDefinition,
    objectIds,
    method,
    abortController,
}: ExportCompositeImageWithCustomRendererParams) => {
    const { xmin, xmax, ymin, ymax } = extent;

    // Create properly ordered rendering rule string
    const renderingRuleString = createOrderedRenderingRuleString(rasterFunctionDefinition);

    const params = new URLSearchParams({
        f: 'image',
        bbox: `${xmin},${ymin},${xmax},${ymax}`,
        bboxSR: '102100',
        imageSR: '102100',
        format: 'png',
        size: `${width},${height}`,
        mosaicRule: JSON.stringify(getCompositeMosaicRule(objectIds, method)),
        renderingRule: renderingRuleString,
    });

    const requestURL = `${serviceUrl}/exportImage?${params.toString()}`;

    const res = await fetch(requestURL, { signal: abortController.signal });

    const blob = await res.blob();

    return blob;
};

type ExportCompositeImageParams = {
    /**
     * imagery service URL
     */
    serviceUrl: string;
    /**
     * Map Extent
     */
    extent: Pick<IExtent, 'xmin' | 'ymin' | 'xmax' | 'ymax'>;
    /**
     * width of map container
     */
    width: number;
    /**
     * height of map container
     */
    height: number;
    /**
     * raster function name that will be used in the rendering rule
     */
    rasterFunctionName: string;
    /**
     * object IDs of the imagery scenes to composite
     */
    objectIds: number[];
    /**
     * Composite method (maps to ArcGIS mosaic operations)
     */
    method: 'first' | 'last' | 'min' | 'max' | 'mean' | 'blend' | 'sum';
    abortController: AbortController;
};

/**
 * Export composite image from multiple scenes using the specified method
 * @param params Export composite image parameters
 * @returns Image blob
 */
export const exportCompositeImage = async ({
    serviceUrl,
    extent,
    width,
    height,
    rasterFunctionName,
    objectIds,
    method,
    abortController,
}: ExportCompositeImageParams) => {
    const { xmin, xmax, ymin, ymax } = extent;

    const params = new URLSearchParams({
        f: 'image',
        bbox: `${xmin},${ymin},${xmax},${ymax}`,
        bboxSR: '102100',
        imageSR: '102100',
        format: 'jpgpng',
        size: `${width},${height}`,
        mosaicRule: JSON.stringify(getCompositeMosaicRule(objectIds, method)),
        renderingRule: JSON.stringify({ rasterFunction: rasterFunctionName }),
    });

    const requestURL = `${serviceUrl}/exportImage?${params.toString()}`;

    console.log('Exporting composite image:', {
        objectIds,
        method,
        mosaicRule: getCompositeMosaicRule(objectIds, method),
        url: requestURL,
    });

    const res = await fetch(requestURL, { signal: abortController.signal });

    const blob = await res.blob();

    return blob;
};

type ExportCompositeImageWithCustomRendererParams = {
    /**
     * imagery service URL
     */
    serviceUrl: string;
    /**
     * Map Extent
     */
    extent: Pick<IExtent, 'xmin' | 'ymin' | 'xmax' | 'ymax'>;
    /**
     * width of map container
     */
    width: number;
    /**
     * height of map container
     */
    height: number;
    /**
     * Full raster function definition (for custom renderers)
     */
    rasterFunctionDefinition: object;
    /**
     * object IDs of the imagery scenes to composite
     */
    objectIds: number[];
    /**
     * Composite method (maps to ArcGIS mosaic operations)
     */
    method: 'first' | 'last' | 'min' | 'max' | 'mean' | 'blend' | 'sum';
    abortController: AbortController;
};

/**
 * Export composite image with custom renderer definition
 * Uses properly ordered JSON to maintain rasterFunction property order required by Esri ImageServer
 */
export const exportCompositeImageWithCustomRenderer = async ({
    serviceUrl,
    extent,
    width,
    height,
    rasterFunctionDefinition,
    objectIds,
    method,
    abortController,
}: ExportCompositeImageWithCustomRendererParams) => {
    const { xmin, xmax, ymin, ymax } = extent;

    // Create properly ordered rendering rule string
    const renderingRuleString = createOrderedRenderingRuleString(rasterFunctionDefinition);

    const params = new URLSearchParams({
        f: 'image',
        bbox: `${xmin},${ymin},${xmax},${ymax}`,
        bboxSR: '102100',
        imageSR: '102100',
        format: 'png',
        size: `${width},${height}`,
        mosaicRule: JSON.stringify(getCompositeMosaicRule(objectIds, method)),
        renderingRule: renderingRuleString,
    });

    const requestURL = `${serviceUrl}/exportImage?${params.toString()}`;

    const res = await fetch(requestURL, { signal: abortController.signal });

    const blob = await res.blob();
