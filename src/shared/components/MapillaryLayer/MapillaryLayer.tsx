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

import React, { FC, useEffect, useRef } from 'react';
import MapView from '@arcgis/core/views/MapView';
import VectorTileLayer from '@arcgis/core/layers/VectorTileLayer';
import { MAPILLARY_TILES_URL } from '@shared/services/mapillary/config';

type Props = {
    mapView?: MapView;
    visible: boolean;
};

/**
 * Mapillary coverage layer component
 * Shows green lines on the map where Mapillary street-level imagery is available
 */
export const MapillaryLayer: FC<Props> = ({ mapView, visible }) => {
    const layerRef = useRef<VectorTileLayer | null>(null);

    useEffect(() => {
        if (!mapView) {
            return;
        }

        // Create Mapillary vector tile layer with custom styling
        // The layer shows sequences (connected images) as green lines
        const layer = new VectorTileLayer({
            url: MAPILLARY_TILES_URL,
            id: 'mapillary-coverage-layer',
            title: 'Mapillary Coverage',
            opacity: 0.8,
            visible: visible,
            // Custom style to show sequences as bright green lines
            // This overrides the default Mapillary styling
            style: {
                version: 8,
                sources: {
                    esri: {
                        type: 'vector',
                        url: MAPILLARY_TILES_URL,
                    },
                },
                layers: [
                    {
                        id: 'mapillary-sequences',
                        type: 'line',
                        source: 'esri',
                        'source-layer': 'sequence',
                        layout: {
                            'line-cap': 'round',
                            'line-join': 'round',
                        },
                        paint: {
                            'line-opacity': 0.8,
                            'line-color': '#05CB63', // Mapillary green
                            'line-width': [
                                'interpolate',
                                ['exponential', 1.5],
                                ['zoom'],
                                12,
                                1.5,
                                22,
                                8,
                            ],
                        },
                    },
                    {
                        id: 'mapillary-images',
                        type: 'circle',
                        source: 'esri',
                        'source-layer': 'image',
                        minzoom: 16,
                        paint: {
                            'circle-radius': [
                                'interpolate',
                                ['exponential', 1.5],
                                ['zoom'],
                                16,
                                2,
                                22,
                                10,
                            ],
                            'circle-color': '#05CB63',
                            'circle-opacity': 0.7,
                        },
                    },
                ],
            },
        });

        mapView.map.add(layer);
        layerRef.current = layer;

        return () => {
            if (layerRef.current) {
                mapView.map.remove(layerRef.current);
                layerRef.current.destroy();
                layerRef.current = null;
            }
        };
    }, [mapView]);

    // Update visibility when prop changes
    useEffect(() => {
        if (layerRef.current) {
            layerRef.current.visible = visible;
        }
    }, [visible]);

    return null;
};
