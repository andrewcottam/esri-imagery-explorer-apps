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
import { useAppDispatch, useAppSelector } from '@shared/store/configureStore';
import { selectCompositeMethod } from '@shared/store/ImageryScene/selectors';
import { compositeMethodChanged } from '@shared/store/ImageryScene/reducer';
import { Dropdown } from '@shared/components/Dropdown';
import { useTranslation } from 'react-i18next';
import { CompositeMethod } from '@shared/store/ImageryScene/reducer';

export const CompositeModeSelector = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const compositeMethod = useAppSelector(selectCompositeMethod);

    const compositeMethods = [
        { value: 'min', label: 'Min', selected: compositeMethod === 'min' },
        { value: 'max', label: 'Max', selected: compositeMethod === 'max' },
        {
            value: 'median',
            label: 'Median',
            selected: compositeMethod === 'median',
        },
    ];

    return (
        <Dropdown
            data={compositeMethods}
            onChange={(value) => {
                dispatch(compositeMethodChanged(value as CompositeMethod));
            }}
        />
    );
};
