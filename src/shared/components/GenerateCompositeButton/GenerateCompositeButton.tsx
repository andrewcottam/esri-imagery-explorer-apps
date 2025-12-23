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

import React from 'react';
import { useAppSelector } from '@shared/store/configureStore';
import {
    selectCompositeSceneIds,
    selectCompositeMethod,
} from '@shared/store/ImageryScene/selectors';
import { Button } from '@shared/components/Button';
import { useTranslation } from 'react-i18next';

export const GenerateCompositeButton = () => {
    const { t } = useTranslation();

    const compositeSceneIds = useAppSelector(selectCompositeSceneIds);
    const compositeMethod = useAppSelector(selectCompositeMethod);

    const isDisabled = !compositeSceneIds || compositeSceneIds.length < 2;

    const handleGenerateComposite = () => {
        if (isDisabled) {
            return;
        }

        // TODO: Implement composite generation
        // This will call the ArcGIS Image Server exportImage API with:
        // - Multiple object IDs (compositeSceneIds)
        // - Composite method (compositeMethod)
        // - Current extent
        // - Selected raster function
        console.log('Generating composite with:', {
            sceneIds: compositeSceneIds,
            method: compositeMethod,
        });

        // The implementation will:
        // 1. Get current map extent
        // 2. Get selected raster function
        // 3. Call exportImage with getCompositeMosaicRule
        // 4. Display result on map or download
    };

    return (
        <Button
            appearance="solid"
            scale="s"
            onClickHandler={handleGenerateComposite}
            disabled={isDisabled}
        >
            <span className="uppercase">{t('generate')}</span>
        </Button>
    );
};
