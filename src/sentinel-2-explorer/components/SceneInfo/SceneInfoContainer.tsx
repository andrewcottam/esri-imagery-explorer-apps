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

import React, { useCallback, useMemo } from 'react';
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
 * Construct the AWS Earth Search COG URL for the TCI (true-colour) GeoTIFF from
 * a Sentinel-2 scene ID.
 *
 * Scene ID format: S2A_MSIL2A_20190610T002101_N0212_R116_T55JDF_20201006T001729
 * Target URL format:
 *   https://e84-earth-search-sentinel-data.s3.us-west-2.amazonaws.com/
 *   sentinel-2-c1-l2a/{zone}/{latBand}/{gridSq}/{year}/{month}/
 *   {satellite}_T{tile}_{datetime}_L2A/TCI.tif
 */
const buildCogUrl = (sceneId: string): string | null => {
    const parts = sceneId.split('_');
    // Expected: [S2A, MSIL2A, 20190610T002101, N0212, R116, T55JDF, 20201006T001729]
    if (parts.length < 7) return null;

    const satellite = parts[0]; // e.g. S2A
    const tileCode = parts[5]; // e.g. T55JDF
    const datetime = parts[2]; // e.g. 20190610T002101

    // Tile code: T55JDF → zone=55, latBand=J, gridSq=DF
    const tileStr = tileCode.startsWith('T') ? tileCode.slice(1) : tileCode;
    if (tileStr.length < 5) return null;
    const zone = tileStr.substring(0, 2); // 55
    const latBand = tileStr.charAt(2); // J
    const gridSq = tileStr.substring(3); // DF

    // Year and month (no leading zero) from acquisition datetime
    if (datetime.length < 6) return null;
    const year = datetime.substring(0, 4); // 2019
    const month = parseInt(datetime.substring(4, 6), 10).toString(); // "6"

    const folder = `${satellite}_T${tileStr}_${datetime}_L2A`;

    return `https://e84-earth-search-sentinel-data.s3.us-west-2.amazonaws.com/sentinel-2-c1-l2a/${zone}/${latBand}/${gridSq}/${year}/${month}/${folder}/TCI.tif`;
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
                // Copy the full AWS COG TCI.tif URL rather than just the scene ID
                copyValue: buildCogUrl(name) ?? name,
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
    }, [data]);

    if (mode === 'dynamic' || mode === 'analysis') {
        return null;
    }

    return <SceneInfoTable data={tableData} />;
};
