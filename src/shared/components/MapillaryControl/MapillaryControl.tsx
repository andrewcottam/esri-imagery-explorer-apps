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
import Point from '@arcgis/core/geometry/Point';
import { MapActionButton } from '../MapActionButton/MapActionButton';
import { MapillaryLayer } from '../MapillaryLayer/MapillaryLayer';
import {
    getClosestMapillaryImage,
    getMapillaryThumbnailUrl,
    getMapillaryViewerUrl,
} from '@shared/services/mapillary/helpers';
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
            // Close popup when deactivating
            if (mapView?.popup && typeof mapView.popup.close === 'function') {
                mapView.popup.close();
            }
            return;
        }

        // Add click handler to show Mapillary popup
        clickHandlerRef.current = mapView.on('click', async (event) => {
            if (!isActive) return;

            setIsLoading(true);
            const point = mapView.toMap({ x: event.x, y: event.y });

            try {
                // Query for closest Mapillary image
                const image = await getClosestMapillaryImage(point, 200);

                if (!image) {
                    console.log('No Mapillary imagery found nearby');
                    if (mapView?.popup && typeof mapView.popup.close === 'function') {
                        mapView.popup.close();
                    }
                    setIsLoading(false);
                    return;
                }

                // Get thumbnail and viewer URLs
                const thumbnailUrl = getMapillaryThumbnailUrl(image.id, 640);
                const viewerUrl = getMapillaryViewerUrl(image.id);

                // Format capture date
                const captureDate = new Date(image.captured_at).toLocaleDateString();

                // Create popup content with thumbnail and link
                const content = `
                    <div style="text-align: center;">
                        <img src="${thumbnailUrl}"
                             alt="Mapillary Street View"
                             style="max-width: 100%; height: auto; border-radius: 4px; margin-bottom: 10px;"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27640%27 height=%27480%27%3E%3Crect fill=%27%23ccc%27 width=%27640%27 height=%27480%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27 fill=%27%23999%27%3EImage not available%3C/text%3E%3C/svg%3E';"
                        />
                        <div style="margin-top: 8px; font-size: 12px; color: #6e6e6e;">
                            Captured: ${captureDate}
                        </div>
                        <a href="${viewerUrl}"
                           target="_blank"
                           rel="noopener noreferrer"
                           style="display: inline-block; margin-top: 10px; padding: 8px 16px; background-color: #05CB63; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">
                            View in Mapillary
                        </a>
                    </div>
                `;

                // Get the actual coordinates of the image
                const imageCoords = image.computed_geometry?.coordinates || image.geometry.coordinates;
                const imagePoint = new Point({
                    longitude: imageCoords[0],
                    latitude: imageCoords[1],
                    spatialReference: { wkid: 4326 },
                });

                // Show popup at image location
                if (mapView?.popup && typeof mapView.popup.open === 'function') {
                    mapView.popup.open({
                        title: 'Mapillary Street View',
                        content: content,
                        location: imagePoint,
                    });
                }
            } catch (error) {
                console.error('Error querying Mapillary:', error);
                if (mapView?.popup && typeof mapView.popup.close === 'function') {
                    mapView.popup.close();
                }
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
