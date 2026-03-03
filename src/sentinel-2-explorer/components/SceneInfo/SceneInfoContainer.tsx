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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    SceneInfoTable,
    SceneInfoTableData,
} from '@shared/components/SceneInfoTable';
import { DATE_FORMAT } from '@shared/constants/UI';
import { useAppSelector } from '@shared/store/configureStore';
import { selectAppMode } from '@shared/store/ImageryScene/selectors';
import { formatInUTCTimeZone } from '@shared/utils/date-time/formatInUTCTimeZone';
import { Sentinel2Scene } from '@typing/imagery-service';
import { getSentinel2SceneByObjectId } from '@shared/services/sentinel-2/getSentinel2Scenes';
import { useDataFromSelectedImageryScene } from '@shared/components/SceneInfoTable/useDataFromSelectedScene';
import { useTranslation } from 'react-i18next';
import { getFormatedDateString } from '@shared/utils/date-time/formatDateString';

/**
 * Query the Element84 Earth Search STAC API to find the TCI.tif COG URL for a
 * given Sentinel-2 scene ID.
 *
 * The Esri service scene ID format is:
 *   S2A_MSIL2A_20250630T002211_N0511_R116_T55JDF_20250630T025659
 *
 * The Earth Search C1 item IDs use a slightly different acquisition timestamp
 * (off by a few seconds), so we cannot construct the URL directly from the
 * scene ID.  Instead we search the STAC API by MGRS tile + acquisition day and
 * pick the item whose satellite prefix matches.
 */
const fetchCogUrlFromStac = async (
    sceneId: string,
    signal: AbortSignal
): Promise<string | null> => {
    const parts = sceneId.split('_');
    // Expected: [S2A, MSIL2A, 20250630T002211, N0511, R116, T55JDF, ...]
    if (parts.length < 7) return null;

    const satellite = parts[0]; // S2A / S2B / S2C
    const tileCode = parts[5]; // T55JDF
    const datetime = parts[2]; // 20250630T002211

    const tileStr = tileCode.startsWith('T') ? tileCode.slice(1) : tileCode; // 55JDF
    if (tileStr.length < 5) return null;

    const mgrsCode = `MGRS-${tileStr}`; // MGRS-55JDF

    // Build a 24-hour window around the acquisition day
    const yyyymmdd = datetime.substring(0, 8); // 20250630
    const iso = `${yyyymmdd.substring(0, 4)}-${yyyymmdd.substring(4, 6)}-${yyyymmdd.substring(6, 8)}`;

    const res = await window.fetch(
        'https://earth-search.aws.element84.com/v1/search',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                collections: ['sentinel-2-c1-l2a'],
                query: { 'grid:code': { eq: mgrsCode } },
                datetime: `${iso}T00:00:00Z/${iso}T23:59:59Z`,
                limit: 20,
            }),
            signal,
        }
    );

    if (!res.ok) return null;

    const json = await res.json();
    const features: any[] = json.features ?? [];

    // Find the item whose ID starts with the same satellite prefix (S2A / S2B / S2C)
    const match = features.find(
        (f) => typeof f.id === 'string' && f.id.startsWith(satellite)
    );

    return (match?.assets?.visual?.href as string) ?? null;
};

export const SceneInfoContainer = () => {
    const { t } = useTranslation();

    const mode = useAppSelector(selectAppMode);

    const fetchSceneByObjectId = useCallback(async (objectId: number) => {
        const res = await getSentinel2SceneByObjectId(objectId);
        return res;
    }, []);

    const data =
        useDataFromSelectedImageryScene<Sentinel2Scene>(fetchSceneByObjectId);

    // The resolved COG URL fetched from the Earth Search STAC API.
    // Falls back to null (which makes copyValue fall back to the scene ID) if
    // the lookup fails or is still in progress.
    const [cogUrl, setCogUrl] = useState<string | null>(null);

    useEffect(() => {
        setCogUrl(null);
        const sceneId = data?.name;
        if (!sceneId) return;

        const controller = new AbortController();

        fetchCogUrlFromStac(sceneId, controller.signal)
            .then((url) => {
                if (!controller.signal.aborted) {
                    setCogUrl(url);
                }
            })
            .catch(() => {
                // Network error or abort — copyValue falls back to scene ID
            });

        return () => controller.abort();
    }, [data?.name]);

    const tableData: SceneInfoTableData[] = useMemo(() => {
        if (!data) {
            return [];
        }

        const {
            acquisitionDate,
            formattedCloudCover,
            name,
            satellite,
            sensor,
            snowIcePercentage,
            productName,
            relativeOrbit,
            sunElevation,
            sunAzimuth,
        } = data;

        return [
            {
                name: t('scene_id'), //'Scene ID',
                value: name, //name.slice(0, 17),
                clickToCopy: true,
                // Copy the Earth Search TCI.tif COG URL once resolved,
                // otherwise fall back to the scene ID itself.
                copyValue: cogUrl ?? name,
            },
            {
                // name: 'Satellite',
                name: t('satellite'),
                value: satellite,
            },
            {
                // name: 'Sensor',
                name: t('sensor'),
                value: sensor,
            },

            {
                // name: 'Acquired',
                name: t('acquired'),
                value: formatInUTCTimeZone(acquisitionDate, DATE_FORMAT),
                testValue: getFormatedDateString({ date: acquisitionDate }),
            },
            {
                // name: 'Cloud Cover',
                name: t('cloud_cover'),
                value: `${formattedCloudCover}%`,
            },
            {
                // name: 'Snow/Ice',
                name: t('snow_ice'),
                value: `${snowIcePercentage}%`,
            },
            {
                name: t('no_data_pixel'), // 'No Data Pixel',
                value: `${data.noDataPixelPercentage}%`,
            },
            {
                // name: 'Product Name',
                name: t('product_name'),
                value: productName,
            },
            {
                // name: 'Relative Orbit',
                name: t('relative_orbit'),
                value: relativeOrbit,
            },
            {
                // name: 'Sun Elevation',
                name: t('sun_elevation_azimuth'),
                value: `${sunElevation}°/${sunAzimuth}°`,
            },
        ];
    }, [data, cogUrl]);

    if (mode === 'dynamic' || mode === 'analysis') {
        return null;
    }

    return <SceneInfoTable data={tableData} />;
};
