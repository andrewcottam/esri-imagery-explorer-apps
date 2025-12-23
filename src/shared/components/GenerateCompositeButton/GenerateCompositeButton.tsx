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
        console.log('Generate button clicked', {
            isDisabled,
            compositeSceneIds,
            compositeMethod,
            mapExtent,
            queryParams,
        });

        if (isDisabled) {
            console.warn('Button is disabled - need at least 2 scenes');
            return;
        }

        if (!mapExtent) {
            console.error('Map extent is not available');
            return;
        }

        if (!queryParams) {
            console.error('Query params are not available');
            return;
        }

        if (!queryParams.rasterFunctionName) {
            console.error('Raster function name is not available');
            return;
        }

        setIsLoading(true);

        try {
            const abortController = new AbortController();

            // Use a standard map size for the exported image
            // This could be made configurable or dynamic based on the actual map view
            const width = 1920;
            const height = 1080;

            console.log('Calling exportCompositeImage with:', {
                serviceUrl: SENTINEL_2_SERVICE_URL,
                extent: mapExtent,
                width,
                height,
                rasterFunctionName: queryParams.rasterFunctionName,
                objectIds: compositeSceneIds,
                method: compositeMethod,
            });

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

            console.log('Received blob:', blob);

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
            alert(`Error generating composite: ${error.message || error}`);
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
