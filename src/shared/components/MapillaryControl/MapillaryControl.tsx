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

import React, { FC, useState, useEffect, useRef } from 'react';
import MapView from '@arcgis/core/views/MapView';
import { MapActionButton } from '../MapActionButton/MapActionButton';
import { MapillaryLayer } from '../MapillaryLayer/MapillaryLayer';
import { openMapillaryAtLocation } from '@shared/services/mapillary/helpers';
import { CalciteIcon } from '@esri/calcite-components-react';
import classNames from 'classnames';

type Props = {
    mapView?: MapView;
};

/**
 * Mapillary control component
 * Toggles Mapillary street-level imagery coverage layer
 * Allows clicking on the map to open Mapillary viewer at that location
 */
export const MapillaryControl: FC<Props> = ({ mapView }) => {
    const [isActive, setIsActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const clickHandlerRef = useRef<__esri.Handle | null>(null);

    // Handle map clicks when Mapillary is active
    useEffect(() => {
        if (!mapView || !isActive) {
            // Remove click handler if exists
            if (clickHandlerRef.current) {
                clickHandlerRef.current.remove();
                clickHandlerRef.current = null;
            }
            return;
        }

        // Add click handler to open Mapillary viewer
        clickHandlerRef.current = mapView.on('click', async (event) => {
            if (!isActive) return;

            setIsLoading(true);
            const point = mapView.toMap({ x: event.x, y: event.y });

            try {
                const success = await openMapillaryAtLocation(point, 200);
                if (!success) {
                    console.log('No Mapillary imagery found nearby');
                    // Could show a toast notification here
                }
            } catch (error) {
                console.error('Error opening Mapillary:', error);
            } finally {
                setIsLoading(false);
            }
        });

        return () => {
            if (clickHandlerRef.current) {
                clickHandlerRef.current.remove();
                clickHandlerRef.current = null;
            }
        };
    }, [mapView, isActive]);

    const handleToggle = () => {
        setIsActive(!isActive);
    };

    if (!mapView) {
        return null;
    }

    return (
        <>
            <div className="relative">
                <MapActionButton
                    tooltip={
                        isActive
                            ? 'Disable Mapillary (Street View)'
                            : 'Enable Mapillary (Street View)'
                    }
                    onClickHandler={handleToggle}
                    active={isActive}
                >
                    {isLoading ? (
                        <CalciteIcon icon="loading" scale="s"></CalciteIcon>
                    ) : (
                        <CalciteIcon icon="camera" scale="s"></CalciteIcon>
                    )}
                </MapActionButton>

                {/* Info tooltip when active */}
                {isActive && (
                    <div
                        className={classNames(
                            'absolute left-full ml-2 top-0 bg-custom-background',
                            'text-custom-light-blue text-xs px-3 py-2 rounded',
                            'whitespace-nowrap pointer-events-none z-10 shadow-lg'
                        )}
                        style={{
                            minWidth: '200px',
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <CalciteIcon icon="information" scale="s"></CalciteIcon>
                            <span>Click map to view street-level imagery</span>
                        </div>
                    </div>
                )}
            </div>

            <MapillaryLayer mapView={mapView} visible={isActive} />
        </>
    );
};
