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

import React, { FC, useRef } from 'react';
import classNames from 'classnames';
import { RasterFunctionInfo } from '@typing/imagery-service';
import { GirdCard } from '../GirdCard/GirdCard';
import useGetTooltipPositionOnHover from '@shared/hooks/useGetTooltipPositionOnHover';
import { Tooltip } from '../Tooltip';
import { IS_MOBILE_DEVICE } from '@shared/constants/UI';
import { useTranslation } from 'react-i18next';
import { CalciteIcon } from '@esri/calcite-components-react';

type Props = {
    /**
     * tooltip text that will be displayed when user hovers the info icon next to the header
     */
    headerTooltip: string;
    /**
     * name of selected raster function
     */
    nameOfSelectedRasterFunction: string;
    /**
     * list of available raster functions
     */
    rasterFunctionInfo: RasterFunctionInfo[];
    /**
     * if true, Raster Function selector should be disabled
     */
    disabled: boolean;
    /**
     * The width of header tooltip container in px. The default width is 240px and this value can be used to override that value
     */
    widthOfTooltipContainer?: number;
    /**
     * Fires when user selects a new raster function
     * @param name name of new raster function
     * @param rasterFunctionInfo the full raster function info object
     * @returns
     */
    onChange: (name: string, rasterFunctionInfo?: RasterFunctionInfo) => void;
    /**
     * Emits when users hovers a grid item in th list
     */
    itemOnHover: (data?: RasterFunctionInfo) => void;
    /**
     * Fires when user clicks the Add icon to add a custom renderer
     */
    onAddClick?: () => void;
    /**
     * if true, show the Add icon in the header (only when user is logged in)
     */
    showAddIcon?: boolean;
    /**
     * Fires when user clicks the Delete icon to delete a custom renderer
     */
    onDeleteClick?: () => void;
    /**
     * if true, show the Delete icon in the header (only when there's a selected custom renderer)
     */
    showDeleteIcon?: boolean;
};

export const RasterFunctionSelector: FC<Props> = ({
    headerTooltip,
    nameOfSelectedRasterFunction,
    rasterFunctionInfo,
    disabled,
    widthOfTooltipContainer,
    onChange,
    itemOnHover,
    onAddClick,
    showAddIcon = false,
    onDeleteClick,
    showDeleteIcon = false,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    useGetTooltipPositionOnHover(containerRef);

    const { t } = useTranslation();

    return (
        <div
            className={classNames('h-full w-auto select-none', {
                'mx-4': IS_MOBILE_DEVICE,
            })}
            ref={containerRef}
        >
            <div
                className={classNames(
                    'text-center mb-3 flex items-center justify-center',
                    {
                        'is-disabled': disabled,
                    }
                )}
            >
                <Tooltip
                    content={headerTooltip}
                    width={widthOfTooltipContainer || 240}
                >
                    <CalciteIcon scale="s" icon="information" />
                </Tooltip>

                <span className="uppercase ml-2 text-sm">{t('renderer')}</span>

                {showAddIcon && onAddClick && (
                    <div
                        className="ml-2 cursor-pointer hover:text-custom-light-blue"
                        onClick={onAddClick}
                        title="Add custom renderer"
                    >
                        <CalciteIcon scale="s" icon="plus-circle" />
                    </div>
                )}

                {showDeleteIcon && onDeleteClick && (
                    <div
                        className="ml-2 cursor-pointer hover:text-red-500"
                        onClick={onDeleteClick}
                        title="Delete selected custom renderer"
                    >
                        <CalciteIcon scale="s" icon="trash" />
                    </div>
                )}
            </div>

            <div
                className="flex flex-wrap max-w-[245px] justify-center gap-[5px] max-h-[155px] pr-1 overflow-x-hidden overflow-y-auto fancy-scrollbar"
                data-testid="renderer-selector-container"
            >
                {rasterFunctionInfo.map((d) => {
                    const { name, thumbnail, label } = d;

                    const selected =
                        // disabled === false &&
                        nameOfSelectedRasterFunction === name;

                    return (
                        <GirdCard
                            key={name}
                            label={label || name}
                            thumbnail={thumbnail}
                            selected={selected}
                            disabled={disabled}
                            onClick={() => {
                                onChange(name, d);
                            }}
                            onMouseEnter={itemOnHover.bind(null, d)}
                            onMouseLeave={itemOnHover.bind(null, null)}
                        />
                    );
                })}
            </div>
        </div>
    );
};
