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

import React, { useMemo } from 'react';
import {
    SceneInfoTable,
    SceneInfoTableData,
} from '@shared/components/SceneInfoTable';
import { DATE_FORMAT } from '@shared/constants/UI';
import { useAppSelector } from '@shared/store/configureStore';
import {
    selectAppMode,
    selectCompositeSceneIds,
    selectCompositeMethod,
    selectAvailableScenes,
} from '@shared/store/ImageryScene/selectors';
import { formatInUTCTimeZone } from '@shared/utils/date-time/formatInUTCTimeZone';
import { useTranslation } from 'react-i18next';

export const CompositeInfoContainer = () => {
    const { t } = useTranslation();

    const mode = useAppSelector(selectAppMode);
    const compositeSceneIds = useAppSelector(selectCompositeSceneIds);
    const compositeMethod = useAppSelector(selectCompositeMethod);
    const availableScenes = useAppSelector(selectAvailableScenes);

    const tableData: SceneInfoTableData[] = useMemo(() => {
        if (!compositeSceneIds || compositeSceneIds.length === 0) {
            return [];
        }

        // Get the selected scenes
        const selectedScenes = availableScenes.filter((scene) =>
            compositeSceneIds.includes(scene.objectId)
        );

        if (selectedScenes.length === 0) {
            return [];
        }

        // Find min and max dates
        const dates = selectedScenes.map((scene) => scene.acquisitionDate);
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);

        return [
            {
                name: t('min_date'),
                value: formatInUTCTimeZone(minDate, DATE_FORMAT),
            },
            {
                name: t('max_date'),
                value: formatInUTCTimeZone(maxDate, DATE_FORMAT),
            },
            {
                name: t('method'),
                value:
                    compositeMethod.charAt(0).toUpperCase() +
                    compositeMethod.slice(1),
            },
            {
                name: t('number_of_scenes'),
                value: selectedScenes.length.toString(),
            },
        ];
    }, [compositeSceneIds, availableScenes, compositeMethod, t]);

    if (mode !== 'composite') {
        return null;
    }

    return <SceneInfoTable data={tableData} title={t('composite_information')} />;
};
