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

import React, { useState } from 'react';
import { useAppSelector } from '@shared/store/configureStore';
import {
    selectCompositeSceneIds,
    selectCompositeMethod,
    selectQueryParams4MainScene,
} from '@shared/store/ImageryScene/selectors';
import { selectMapExtent } from '@shared/store/Map/selectors';
import { Button } from '@shared/components/Button';
import { useTranslation } from 'react-i18next';
import { exportCompositeImage } from '@shared/services/helpers/exportImage';
import { SENTINEL_2_SERVICE_URL } from '@shared/services/sentinel-2/config';

export const GenerateCompositeButton = () => {
    const { t } = useTranslation();

    const [isLoading, setIsLoading] = useState(false);

    const compositeSceneIds = useAppSelector(selectCompositeSceneIds);
    const compositeMethod = useAppSelector(selectCompositeMethod);
    const mapExtent = useAppSelector(selectMapExtent);
    const queryParams = useAppSelector(selectQueryParams4MainScene);

    const isDisabled = !compositeSceneIds || compositeSceneIds.length < 2;

    const handleGenerateComposite = async () => {
        if (isDisabled || !mapExtent || !queryParams) {
            return;
        }

        setIsLoading(true);

        try {
            const abortController = new AbortController();

            // Use a standard map size for the exported image
            // This could be made configurable or dynamic based on the actual map view
            const width = 1920;
            const height = 1080;

            const blob = await exportCompositeImage({
                serviceUrl: SENTINEL_2_SERVICE_URL,
                extent: mapExtent,
                width,
                height,
                rasterFunctionName: queryParams.rasterFunctionName,
                objectIds: compositeSceneIds,
                method: compositeMethod,
                abortController,
            });

            // Download the composite image
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `composite_${compositeMethod}_${compositeSceneIds.length}_scenes.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log('Composite image generated and downloaded successfully');
        } catch (error) {
            console.error('Error generating composite:', error);
            // TODO: Show error message to user
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            appearance="solid"
            scale="s"
            onClickHandler={handleGenerateComposite}
            disabled={isDisabled || isLoading}
        >
            <span className="uppercase">
                {isLoading ? t('loading') : t('generate')}
            </span>
        </Button>
    );
};
