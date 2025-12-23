/* Copyright 2025 Esri
 *
 * Licensed under the Apache License Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { FC, useCallback } from 'react';
import CompositeCalendar, { FormattedImageryScene } from './CompositeCalendar';
import { useAppSelector, useAppDispatch } from '@shared/store/configureStore';
import { Dropdown } from '@shared/components/Dropdown';
import { useAcquisitionYearsAsDropdownMenuOptions } from '@shared/hooks/useAcquisitionYearsAsDropdownMenuOptions';
import {
    selectQueryParams4SceneInSelectedMode,
    selectCompositeSceneIds,
} from '@shared/store/ImageryScene/selectors';
import { updateAcquisitionDateRange } from '@shared/store/ImageryScene/thunks';
import { compositeSceneIdsChanged } from '@shared/store/ImageryScene/reducer';
import classNames from 'classnames';
import { useFormattedScenesForComposite } from './useFormattedScenesForComposite';
import { useShouldDisableCalendar } from '../Calendar/useShouldDisableCalendar';
import {
    getDateRangeForPast12Month,
    getDateRangeForYear,
} from '@shared/utils/date-time/getTimeRange';
import { useAcquisitionYear } from '../Calendar/useAcquisitionYear';
import { useTranslation } from 'react-i18next';

type Props = {
    children?: React.ReactNode;
};

const CompositeCalendarContainer: FC<Props> = ({ children }: Props) => {
    const { t } = useTranslation();

    const dispatch = useAppDispatch();

    const queryParams = useAppSelector(selectQueryParams4SceneInSelectedMode);
    const compositeSceneIds = useAppSelector(selectCompositeSceneIds);

    const acquisitionDateRange = queryParams?.acquisitionDateRange;

    const acquisitionYear = useAcquisitionYear();

    /**
     * This custom hook retrieves a list of available imagery scenes that intersect with the map center and were acquired during the input year.
     * It formats these scenes into `FormattedImageryScene[]` format suitable for populating the CompositeCalendar component (includes objectId).
     */
    const formattedScenes: FormattedImageryScene[] =
        useFormattedScenesForComposite();

    /**
     * options that will be used to populate the Dropdown Menu for year
     */
    const yearOptions = useAcquisitionYearsAsDropdownMenuOptions(
        acquisitionYear,
        true
    );

    /**
     * if true, Calendar should be disbaled
     */
    const shouldBeDisabled = useShouldDisableCalendar();

    const handleSceneSelection = useCallback(
        (objectId: number, isShiftKey: boolean, isMetaOrCtrlKey: boolean) => {
            if (!isShiftKey && !isMetaOrCtrlKey) {
                // Simple click - toggle single scene
                const isSelected = compositeSceneIds.includes(objectId);
                if (isSelected) {
                    dispatch(
                        compositeSceneIdsChanged(
                            compositeSceneIds.filter((id) => id !== objectId)
                        )
                    );
                } else {
                    dispatch(
                        compositeSceneIdsChanged([
                            ...compositeSceneIds,
                            objectId,
                        ])
                    );
                }
            } else if (isMetaOrCtrlKey) {
                // Cmd/Ctrl + click - toggle scene in selection
                const isSelected = compositeSceneIds.includes(objectId);
                if (isSelected) {
                    dispatch(
                        compositeSceneIdsChanged(
                            compositeSceneIds.filter((id) => id !== objectId)
                        )
                    );
                } else {
                    dispatch(
                        compositeSceneIdsChanged([
                            ...compositeSceneIds,
                            objectId,
                        ])
                    );
                }
            } else if (isShiftKey && compositeSceneIds.length > 0) {
                // Shift + click - select range
                const lastSelectedId =
                    compositeSceneIds[compositeSceneIds.length - 1];

                // Find the indices of the scenes in the formattedScenes array
                const lastIndex = formattedScenes.findIndex(
                    (scene) => scene.objectId === lastSelectedId
                );
                const currentIndex = formattedScenes.findIndex(
                    (scene) => scene.objectId === objectId
                );

                if (lastIndex !== -1 && currentIndex !== -1) {
                    const startIndex = Math.min(lastIndex, currentIndex);
                    const endIndex = Math.max(lastIndex, currentIndex);

                    const rangeSceneIds = formattedScenes
                        .slice(startIndex, endIndex + 1)
                        .map((scene) => scene.objectId);

                    // Merge with existing selection
                    const newSelection = [
                        ...new Set([
                            ...compositeSceneIds,
                            ...rangeSceneIds,
                        ]),
                    ];
                    dispatch(compositeSceneIdsChanged(newSelection));
                }
            }
        },
        [compositeSceneIds, formattedScenes, dispatch]
    );

    return (
        <div
            className={classNames('select-none', {
                'is-disabled': shouldBeDisabled,
            })}
            data-testid="composite-calendar-container"
        >
            <div className="text-center mb-2">
                <span className="uppercase text-sm">
                    {t('scenes_selection')}
                </span>
            </div>

            <div className="flex mb-2 items-center justify-between">
                <div className="flex items-center flex-grow">
                    <div
                        className="relative w-[130px]"
                        data-testid="year-selection-dropdown"
                    >
                        <Dropdown
                            data={yearOptions}
                            onChange={(year) => {
                                const updatedDateRange = year
                                    ? getDateRangeForYear(+year)
                                    : getDateRangeForPast12Month();

                                dispatch(
                                    updateAcquisitionDateRange(updatedDateRange)
                                );
                            }}
                        />
                    </div>

                    <div className="ml-2 text-sm">
                        {compositeSceneIds.length > 0 ? (
                            <span className="text-custom-light-blue">
                                {t('scenes_selected', {
                                    count: compositeSceneIds.length,
                                })}
                            </span>
                        ) : (
                            <span className="text-custom-light-blue-50">
                                {t('select_a_date')}
                            </span>
                        )}
                    </div>
                </div>

                {children}
            </div>

            <CompositeCalendar
                dateRange={acquisitionDateRange || getDateRangeForPast12Month()}
                selectedSceneIds={compositeSceneIds}
                availableScenes={formattedScenes}
                onSelect={handleSceneSelection}
            />
        </div>
    );
};

export default CompositeCalendarContainer;
