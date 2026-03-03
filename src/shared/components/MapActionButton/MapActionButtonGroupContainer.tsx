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
import React, { FC, useState, useCallback } from 'react';
import { MapActionButtonGroup } from './MapActionButtonGroup';
import { ZoomToExtent } from '../ZoomToExtent';
import { ZoomWidget } from '../MapView/ZoomWidget';
import { Zoom2NativeScale } from '../Zoom2NativeScale/Zoom2NativeScale';
import { SearchWidget } from '../SearchWidget';
import { useTranslation } from 'react-i18next';
import { AddBookmarkButton } from '../AddBookmarkButton/AddBookmarkButton';
import { BasemapGallery } from '../BasemapGallery';
import { MapillaryControl } from '../MapillaryControl';
import { NDVITimeSeriesControl } from '@shared/components/NDVITimeSeries/NDVITimeSeriesControl';
import { IdentifyControl, ExternalMapClick } from '@shared/components/IdentifyTool/IdentifyControl';

type Props = {
    mapView?: MapView;
    /**
     * The URL of image service that will be used to zoom to its extent
     */
    serviceUrl: string;
    /**
     * The native scale of the image service
     */
    nativeScale: number;
    /**
     * The name of the image service
     */
    serviceName: string;
};

export const MapActionButtonGroupContainer: FC<Props> = ({
    mapView,
    serviceUrl,
    serviceName,
    nativeScale,
}) => {
    const { t } = useTranslation();

    // ── Shared click coordination between time-series and identify ─────────────
    // When the time-series panel is active it owns the map click and marker.
    // IdentifyControl listens to the same click via externalClick so both panels
    // are populated from a single user action with a single map marker.
    const [ndviIsActive, setNdviIsActive] = useState(false);
    const [ndviClick, setNdviClick] = useState<ExternalMapClick | null>(null);

    const handleNdviIsActiveChange = useCallback((active: boolean) => {
        setNdviIsActive(active);
        if (!active) setNdviClick(null);
    }, []);

    const handleNdviMapClick = useCallback(
        (lat: number, lon: number, screenX: number, screenY: number) => {
            setNdviClick({ lat, lon, screenX, screenY });
        },
        []
    );

    if (!mapView) return null;

    return (
        <MapActionButtonGroup>
            <SearchWidget mapView={mapView} />
            <BasemapGallery mapView={mapView} />
            <ZoomWidget mapView={mapView} />
            <Zoom2NativeScale
                mapView={mapView}
                nativeScale={nativeScale}
                tooltip={t('zoom_to_native_scale', { serviceName })}
            />
            <ZoomToExtent mapView={mapView} serviceUrl={serviceUrl} />

            <AddBookmarkButton mapView={mapView} />
            <MapillaryControl mapView={mapView} />
            <NDVITimeSeriesControl
                mapView={mapView}
                onIsActiveChange={handleNdviIsActiveChange}
                onMapClick={handleNdviMapClick}
            />
            <IdentifyControl
                mapView={mapView}
                isExternallyDriven={ndviIsActive}
                externalClick={ndviIsActive ? ndviClick : null}
            />
        </MapActionButtonGroup>
    );
};
