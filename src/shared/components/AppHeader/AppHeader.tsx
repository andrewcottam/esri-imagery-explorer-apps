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
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { useAppSelector } from '@shared/store/configureStore';
import { useAppDispatch } from '@shared/store/configureStore';
import {
    appHeaderDropdownPanelChanged,
    showDocPanelToggled,
} from '../../store/UI/reducer';
import useOnClickOutside from '@shared/hooks/useOnClickOutside';
import {
    selectAppHeaderDropdownPanel,
    selectIsAnimationPlaying,
} from '@shared/store/UI/selectors';
import { APP_NAME, AppName } from '@shared/config';
import { encodeMapCenter } from '@shared/utils/url-hash-params/map';
import { selectMapCenter, selectMapZoom } from '@shared/store/Map/selectors';
import { UrlHashParamKey } from '@shared/utils/url-hash-params';
import { useTranslation } from 'react-i18next';
import {
    useDataOfImageryExplorerApps,
    useDataOfImageryUtilityApps,
} from '@shared/hooks/useDataOfImageryExplorerApps';
import { AppLauchList } from './AppLauchList';
import { CalciteButton, CalciteIcon } from '@esri/calcite-components-react';
import { useSupportedLocales } from '@shared/hooks/useSupportedLocales';
import { LocaleSwitcher } from './LocaleSwitcher';
import { useShouldSuggestLocale } from '@shared/hooks/useSuggestLocale';

type Props = {
    /**
     * title of the explorer app
     */
    title: string;
    /**
     * if true, show the doc button that allows user to launch the doc panel
     */
    showDocButton?: boolean;
    /**
     * tooltip text for the open documentation button
     */
    docButtonTooltip?: string;
};

const AppHeader: FC<Props> = ({ title, showDocButton, docButtonTooltip }) => {
    const { t } = useTranslation();

    const dispatch = useAppDispatch();

    const isAnimationPlaying = useAppSelector(selectIsAnimationPlaying);

    // const [showImageryExplorerAppsList, setShowImageryExplorerAppsList] =
    //     useState<boolean>(false);

    const containerRef = useRef<HTMLDivElement>(null);

    const mapCenter = useAppSelector(selectMapCenter);

    const zoom = useAppSelector(selectMapZoom);

    const launchImageryExplorerApp = (url: string) => {
        const key: UrlHashParamKey = 'mapCenter';
        const targetURL = url + `#${key}=${encodeMapCenter(mapCenter, zoom)}`;
        window.open(targetURL, '_blank');
    };

    const imageryExplorerApps = useDataOfImageryExplorerApps();

    const imageryUtilityApps = useDataOfImageryUtilityApps();

    /**
     * Get supported locales for the app
     */
    const supportedLocales = useSupportedLocales();

    /**
     * get the app header dropdown panel from the store
     */
    const appHeaderDropdownPanel = useAppSelector(selectAppHeaderDropdownPanel);

    /**
     * Determine whether to show the imagery explorer apps list
     */
    const showImageryExplorerAppsList = appHeaderDropdownPanel === 'app-list';

    /**
     * Determine whether to show the language switcher list.
     * It should only show the language switcher list if there is more than one supported locale.
     */
    const showLocaleSwitcherList = useMemo(() => {
        return (
            appHeaderDropdownPanel === 'locale-switcher' &&
            supportedLocales.length &&
            supportedLocales.length > 1
        );
    }, [appHeaderDropdownPanel, supportedLocales?.length]);

    /**
     * Determine whether to show the language switcher button
     */
    const showLanguageSwitcherToggleButton = supportedLocales.length > 1;

    /**
     * Determine whether to suggest locale switch on app startup.
     * This hook will open the locale switcher panel if it should suggest locale.
     * The criteria for suggesting locale switch is:
     * 1. there is a suggested locale
     * 2. the suggested locale is different from the current app language
     * 3. the user has not disabled locale suggestion
     * 4. there is more than one supported locale
     */
    const shouldSuggestLocale = useShouldSuggestLocale(supportedLocales.length);

    useOnClickOutside(
        containerRef,
        // setShowImageryExplorerAppsList.bind(null, false)
        () => {
            // close any opened dropdown panel in the app header
            // when clicked outside the app header
            dispatch(appHeaderDropdownPanelChanged(null));
        }
    );

    // toggle the app launcher list visibility
    const toggleAppLauncherList = () => {
        const newValue = showImageryExplorerAppsList ? null : 'app-list';

        dispatch(appHeaderDropdownPanelChanged(newValue));
    };

    // toggle the language switcher list visibility
    const toggleLanguageSwitcherList = () => {
        const newValue =
            appHeaderDropdownPanel === 'locale-switcher'
                ? null
                : 'locale-switcher';

        dispatch(appHeaderDropdownPanelChanged(newValue));
    };

    return (
        <div
            className={classNames(
                'absolute z-20 text-custom-light-blue flex top-0 left-0 right-0 md:top-map-ui-top-position md:left-map-ui-top-position md:right-auto',
                {
                    hidden: isAnimationPlaying,
                }
            )}
            ref={containerRef}
        >
            <div
                className={classNames(
                    'relative theme-background p-1 px-2 text-lg font-light items-center h-app-header-size flex-grow md:flex-grow-0'
                )}
            >
                <div className="flex h-full items-center">
                    <div className="flex-grow">
                        <span className="text-sm md:text-lg">{title}</span>
                    </div>

                </div>
            </div>

            {showDocButton && (
                <div
                    className="h-app-header-size w-app-header-size  theme-background cursor-pointer border-l border-custom-light-blue-50 pl-2 flex items-center"
                    onClick={() => {
                        dispatch(showDocPanelToggled());
                    }}
                    title={docButtonTooltip || ''}
                >
                    <CalciteIcon icon="open-book" />
                </div>
            )}

            {showLanguageSwitcherToggleButton && (
                <div
                    className="h-app-header-size w-app-header-size theme-background border-l border-custom-light-blue-50 pl-2 flex items-center"
                    style={{
                        '--calcite-button-text-color':
                            'var(--custom-light-blue)',
                    }}
                    title={t('switch_language')}
                >
                    <CalciteButton
                        appearance="transparent"
                        scale="s"
                        iconStart="language-2"
                        label={t('switch_language')}
                        onClick={toggleLanguageSwitcherList}
                    ></CalciteButton>
                </div>
            )}

            {showImageryExplorerAppsList && (
                <div
                    className={classNames(
                        'absolute left-0 md:left-app-header-size top-app-header-size theme-background w-full md:w-[300px] border-t border-custom-light-blue-50'
                    )}
                >
                    <AppLauchList
                        header={t('image_explorer_apps')}
                        apps={imageryExplorerApps.filter(
                            (d) => d.appName !== APP_NAME
                        )}
                        onClick={launchImageryExplorerApp}
                    />

                    <AppLauchList
                        header={t('image_utility_apps')}
                        apps={imageryUtilityApps.filter(
                            (d) => d.appName !== APP_NAME
                        )}
                        onClick={launchImageryExplorerApp}
                    />
                </div>
            )}

            {showLocaleSwitcherList && (
                <LocaleSwitcher
                    data={supportedLocales}
                    shouldSuggestLocale={shouldSuggestLocale}
                />
            )}
        </div>
    );
};

export default AppHeader;
