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

import React, { FC, useState, useRef } from 'react';
import { MapActionButton } from '../MapActionButton/MapActionButton';
import { useAppDispatch, useAppSelector } from '@shared/store/configureStore';
import { selectIsAnimationPlaying } from '@shared/store/UI/selectors';
import BasemapGalleryWidget from './BasemapGallery';
import MapView from '@arcgis/core/views/MapView';
import classNames from 'classnames';
import useOnClickOutside from '@shared/hooks/useOnClickOutside';
import { useTranslation } from 'react-i18next';
import { CalciteIcon } from '@esri/calcite-components-react';
import {
    showMapLabelToggled,
    showTerrainToggled,
    showBasemapToggled,
} from '@shared/store/Map/reducer';
import {
    selectShowMapLabel,
    selectShowTerrain,
    selectShowBasemap,
} from '@shared/store/Map/selectors';

const CheckIcon = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        height="16"
        width="16"
    >
        <path
            fill="currentColor"
            d="M14.071 15a.929.929 0 0 0 .929-.929V2.93a.929.929 0 0 0-.929-.93H2.93a.929.929 0 0 0-.93.929V14.07a.929.929 0 0 0 .929.929zM3 3h11v11H3zm9.262 2l.738.738-5.443 5.43-2.822-2.822.738-.738 2.084 2.088z"
        />
        <path fill="none" d="M0 0h16v16H0z" />
    </svg>
);

const UncheckIcon = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        height="16"
        width="16"
    >
        <path
            fill="currentColor"
            d="M14.071 15a.929.929 0 0 0 .929-.929V2.93a.929.929 0 0 0-.929-.93H2.93a.929.929 0 0 0-.93.929V14.07a.929.929 0 0 0 .929.929zM3 3h11v11H3z"
        />
        <path fill="none" d="M0 0h16v16H0z" />
    </svg>
);

type Props = {
    mapView?: MapView;
};

export const BasemapGalleryContainer: FC<Props> = ({ mapView }) => {
    const { t } = useTranslation();

    const dispatch = useAppDispatch();

    const containerRef = useRef<HTMLDivElement>(null);

    const isAnimationPlaying = useAppSelector(selectIsAnimationPlaying);

    const showMapLabel = useAppSelector(selectShowMapLabel);
    const showTerrain = useAppSelector(selectShowTerrain);
    const showBasemap = useAppSelector(selectShowBasemap);

    const [isBasemapGalleryOpen, setIsBasemapGalleryOpen] = useState(false);

    useOnClickOutside(containerRef, () => {
        setIsBasemapGalleryOpen(false);
    });

    if (!mapView) {
        return null;
    }

    return (
        <div className="relative" ref={containerRef}>
            <MapActionButton
                tooltip={t('basemap_gallery_tooltip') || 'Change Basemap'}
                onClickHandler={() => {
                    setIsBasemapGalleryOpen(!isBasemapGalleryOpen);
                }}
            >
                <CalciteIcon icon="basemap" scale="s"></CalciteIcon>
            </MapActionButton>

            <div
                className={classNames(
                    'absolute top-0 left-full ml-[2px] z-20 flex',
                    {
                        hidden: !isBasemapGalleryOpen,
                    }
                )}
            >
                <div
                    style={{
                        width: '350px',
                        maxHeight: '400px',
                        overflow: 'auto',
                    }}
                >
                    <BasemapGalleryWidget
                        mapView={mapView}
                        hide={isAnimationPlaying}
                    />
                </div>

                <div className="theme-background text-custom-light-blue text-xs p-3 flex flex-col gap-3 border-l border-custom-light-blue-50 whitespace-nowrap">
                    <div
                        className="cursor-pointer flex items-center"
                        onClick={() => dispatch(showMapLabelToggled())}
                    >
                        {showMapLabel ? CheckIcon : UncheckIcon}
                        <span className="ml-1">{t('map_labels')}</span>
                    </div>
                    <div
                        className="cursor-pointer flex items-center"
                        onClick={() => dispatch(showTerrainToggled())}
                    >
                        {showTerrain ? CheckIcon : UncheckIcon}
                        <span className="ml-1">{t('terrain')}</span>
                    </div>
                    <div
                        className="cursor-pointer flex items-center"
                        onClick={() => dispatch(showBasemapToggled())}
                    >
                        {showBasemap ? CheckIcon : UncheckIcon}
                        <span className="ml-1">{t('basemap')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
