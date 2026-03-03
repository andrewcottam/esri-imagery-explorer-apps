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

import React, { FC, useState, useEffect, useRef, useCallback } from 'react';
import MapView from '@arcgis/core/views/MapView';
import Point from '@arcgis/core/geometry/Point';
import Graphic from '@arcgis/core/Graphic';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import { MapActionButton } from '@shared/components/MapActionButton/MapActionButton';
import { CalciteIcon } from '@esri/calcite-components-react';
import { identify } from '@shared/services/helpers/identify';
import { getPixelValuesFromIdentifyTaskResponse } from '@shared/services/helpers/getPixelValuesFromIdentifyTaskResponse';
import { SENTINEL_2_SERVICE_URL } from '@shared/services/sentinel-2/config';
import { calcSentinel2SpectralIndex } from '@shared/services/sentinel-2/helpers';
import { useAppSelector } from '@shared/store/configureStore';
import {
    selectQueryParams4SceneInSelectedMode,
    selectAppMode,
} from '@shared/store/ImageryScene/selectors';

// Spectral bands returned by the Sentinel-2 ImageServer identify task (indices 0–11).
// The service skips B10 (Cirrus) — not present in the L2A response.
// Indices 12–14 are quality layers (AOT, WVP, SCL) — excluded from display.
const BAND_NAMES = [
    'Coastal (B01)',     // index 0
    'Blue (B02)',        // index 1
    'Green (B03)',       // index 2
    'Red (B04)',         // index 3
    'Red Edge (B05)',    // index 4
    'Red Edge (B06)',    // index 5
    'Red Edge (B07)',    // index 6
    'NIR (B08)',         // index 7
    'NIR Narrow (B8A)', // index 8
    'Water Vapor (B09)',// index 9
    'SWIR 1 (B11)',     // index 10  (B10 Cirrus absent in L2A)
    'SWIR 2 (B12)',     // index 11
] as const;

/** Estimated panel dimensions for off-screen clamping. */
const PANEL_W = 240;
const PANEL_H = 340;

type IdentifyResult = {
    bandValues: number[];
    lat: number;
    lon: number;
    panelX: number;
    panelY: number;
};

/** An external click event driven by another tool (e.g. the time-series panel). */
export type ExternalMapClick = {
    lat: number;
    lon: number;
    screenX: number;
    screenY: number;
};

type Props = {
    mapView?: MapView;
    /**
     * When true, another tool is managing the map click and the map marker.
     * IdentifyControl will not register its own click handler or draw a marker.
     */
    isExternallyDriven?: boolean;
    /**
     * Fires when the coordinating tool (e.g. time-series) handles a map click.
     * IdentifyControl will query that location when this changes.
     */
    externalClick?: ExternalMapClick | null;
};

export const IdentifyControl: FC<Props> = ({
    mapView,
    isExternallyDriven = false,
    externalClick,
}) => {
    const [isActive, setIsActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<IdentifyResult | null>(null);
    const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const mode = useAppSelector(selectAppMode);
    const queryParams = useAppSelector(selectQueryParams4SceneInSelectedMode);

    // Disabled when there is no scene to query (mirrors ZoomToExtent behaviour).
    // In dynamic mode the service always shows the latest scene, so it is always enabled.
    const isDisabled = mode !== 'dynamic' && !queryParams?.objectIdOfSelectedScene;

    // Stable refs so callbacks never need rebuilding on Redux state changes.
    const modeRef = useRef(mode);
    const queryParamsRef = useRef(queryParams);
    modeRef.current = mode;
    queryParamsRef.current = queryParams;

    const abortControllerRef = useRef<AbortController | null>(null);
    const clickHandlerRef = useRef<__esri.Handle | null>(null);
    const markerGraphicRef = useRef<Graphic | null>(null);
    // Stable ref for isExternallyDriven — read inside the click handler so that
    // if the handler fires during the brief race window (identify's handler is still
    // registered while time-series just activated), it yields immediately without
    // calling stopPropagation(), preventing it from blocking the time-series handler.
    const isExternallyDrivenRef = useRef(isExternallyDriven);
    isExternallyDrivenRef.current = isExternallyDriven;

    // ── Map marker (same style as the time-series panel) ──────────────────────

    const showPointOnMap = useCallback(
        (lat: number, lon: number) => {
            if (!mapView) return;
            if (markerGraphicRef.current) {
                mapView.graphics.remove(markerGraphicRef.current);
            }
            const graphic = new Graphic({
                geometry: new Point({ latitude: lat, longitude: lon }),
                symbol: new SimpleMarkerSymbol({
                    style: 'circle',
                    color: [5, 203, 99, 220],
                    size: 12,
                    outline: { color: [255, 255, 255, 200], width: 1.5 },
                }),
            });
            markerGraphicRef.current = graphic;
            mapView.graphics.add(graphic);
        },
        [mapView]
    );

    // ── Core fetch logic ──────────────────────────────────────────────────────

    const fetchIdentify = useCallback(
        async (lat: number, lon: number, panelX: number, panelY: number) => {
            setPendingPos({ x: panelX, y: panelY });
            setResult(null);
            setError(null);
            setIsLoading(true);

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            try {
                const params = queryParamsRef.current;
                const currentMode = modeRef.current;
                const point = new Point({
                    latitude: lat,
                    longitude: lon,
                    spatialReference: { wkid: 4326 },
                });

                const res = await identify({
                    serviceURL: SENTINEL_2_SERVICE_URL,
                    point,
                    objectIds:
                        currentMode !== 'dynamic' && params?.objectIdOfSelectedScene
                            ? [params.objectIdOfSelectedScene]
                            : null,
                    abortController: abortControllerRef.current,
                    maxItemCount: 1,
                });

                const bandValues = getPixelValuesFromIdentifyTaskResponse(res);

                if (!bandValues) {
                    throw new Error('No data at this location');
                }

                setResult({ bandValues, lat, lon, panelX, panelY });
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    setError(err.message || 'Failed to identify pixel values');
                }
            } finally {
                setIsLoading(false);
            }
        },
        [] // modeRef / queryParamsRef are stable refs
    );

    // ── Panel position helper ─────────────────────────────────────────────────

    const calcPanelPos = (screenX: number, screenY: number) => {
        const rawX = screenX + 16;
        const panelX =
            rawX + PANEL_W > window.innerWidth ? screenX - PANEL_W - 16 : rawX;
        const rawY = screenY - 20;
        const panelY =
            rawY + PANEL_H > window.innerHeight
                ? window.innerHeight - PANEL_H - 8
                : Math.max(8, rawY);
        return { panelX, panelY };
    };

    // ── Own click handler (when not driven by another tool) ───────────────────

    const handleClick = useCallback(
        async (event: __esri.ViewClickEvent) => {
            // If time-series just became active (race window), yield to it.
            // Do NOT call stopPropagation so the time-series handler can still fire.
            if (isExternallyDrivenRef.current) return;

            event.stopPropagation();

            const { latitude, longitude } = event.mapPoint;
            const clientX = (event.native as MouseEvent).clientX;
            const clientY = (event.native as MouseEvent).clientY;
            const { panelX, panelY } = calcPanelPos(clientX, clientY);

            showPointOnMap(latitude, longitude);
            fetchIdentify(latitude, longitude, panelX, panelY);
        },
        [mapView, showPointOnMap, fetchIdentify]
    );

    // Register / deregister own click handler.
    // Suppressed when another tool is managing clicks (isExternallyDriven).
    useEffect(() => {
        if (!mapView || !isActive || isExternallyDriven) {
            clickHandlerRef.current?.remove();
            clickHandlerRef.current = null;
            return;
        }
        clickHandlerRef.current = mapView.on('click', handleClick);
        return () => {
            clickHandlerRef.current?.remove();
            clickHandlerRef.current = null;
        };
    }, [mapView, isActive, isExternallyDriven, handleClick]);

    // ── React to external click from the coordinating tool ────────────────────

    useEffect(() => {
        if (!externalClick || !isActive) return;
        const { lat, lon, screenX, screenY } = externalClick;
        const { panelX, panelY } = calcPanelPos(screenX, screenY);
        fetchIdentify(lat, lon, panelX, panelY);
    }, [externalClick, isActive, fetchIdentify]);

    // ── Clean up on deactivate ────────────────────────────────────────────────

    useEffect(() => {
        if (!isActive) {
            setResult(null);
            setError(null);
            setPendingPos(null);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (markerGraphicRef.current && mapView) {
                mapView.graphics.remove(markerGraphicRef.current);
                markerGraphicRef.current = null;
            }
        }
    }, [isActive, mapView]);

    // ── Derived display values ────────────────────────────────────────────────

    const panelPos = result ? { x: result.panelX, y: result.panelY } : pendingPos;

    const ndvi =
        result?.bandValues != null
            ? calcSentinel2SpectralIndex('vegetation', result.bandValues).toFixed(3)
            : null;

    const showPanel =
        isActive && panelPos != null && (isLoading || result != null || error != null);

    return (
        <>
            <MapActionButton
                tooltip={isDisabled ? 'Select a scene first to identify band values' : isActive ? 'Disable identify' : 'Identify band values'}
                onClickHandler={() => { if (!isDisabled) setIsActive((v) => !v); }}
                active={isActive}
                disabled={isDisabled}
                showLoadingIndicator={isLoading}
            >
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width={18}
                        height={18}
                    >
                        <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                        <line x1="12" y1="2" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="2" y1="12" x2="7" y2="12" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="17" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                </div>
            </MapActionButton>

            {showPanel && (
                <div
                    style={{
                        position: 'fixed',
                        left: panelPos.x,
                        top: panelPos.y,
                        zIndex: 60,
                        background: 'var(--custom-background-95, rgba(30,30,30,0.97))',
                        border: '1px solid var(--custom-light-blue-25)',
                        borderRadius: 4,
                        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                        width: PANEL_W,
                    }}
                >
                    {/* ── Header ── */}
                    <div
                        className="flex items-center justify-between px-3 py-2"
                        style={{ borderBottom: '1px solid var(--custom-light-blue-25)' }}
                    >
                        <span
                            className="text-xs font-semibold uppercase tracking-wider"
                            style={{ color: 'var(--custom-light-blue)' }}
                        >
                            Band Values
                        </span>
                        <button
                            onClick={() => {
                                setResult(null);
                                setPendingPos(null);
                            }}
                            style={{ color: 'var(--custom-light-blue-50)', lineHeight: 1 }}
                            title="Close"
                        >
                            <CalciteIcon icon="x" scale="s" />
                        </button>
                    </div>

                    {/* ── Body ── */}
                    <div className="px-3 py-2">
                        {isLoading && (
                            <div
                                className="text-xs py-6 text-center"
                                style={{ color: 'var(--custom-light-blue-50)' }}
                            >
                                Loading…
                            </div>
                        )}

                        {!isLoading && error && (
                            <div
                                className="text-xs py-2"
                                style={{ color: '#ff8888' }}
                            >
                                {error}
                            </div>
                        )}

                        {!isLoading && result && (
                            <>
                                {/* ── Band value table (indices 0–11 only) ── */}
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr auto',
                                        rowGap: 3,
                                    }}
                                >
                                    {BAND_NAMES.map((name, i) => (
                                        <React.Fragment key={i}>
                                            <span
                                                className="text-xs"
                                                style={{ color: 'var(--custom-light-blue-50)' }}
                                            >
                                                {name}
                                            </span>
                                            <span
                                                className="text-xs"
                                                style={{
                                                    color: 'var(--custom-light-blue)',
                                                    textAlign: 'right',
                                                    fontVariantNumeric: 'tabular-nums',
                                                    paddingLeft: 12,
                                                }}
                                            >
                                                {result.bandValues[i] != null
                                                    ? result.bandValues[i].toFixed(4)
                                                    : '—'}
                                            </span>
                                        </React.Fragment>
                                    ))}
                                </div>

                                {/* ── Divider ── */}
                                <div
                                    style={{
                                        borderTop: '1px solid var(--custom-light-blue-25)',
                                        marginTop: 7,
                                        paddingTop: 7,
                                    }}
                                >
                                    {/* NDVI */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: 3,
                                        }}
                                    >
                                        <span
                                            className="text-xs"
                                            style={{ color: 'var(--custom-light-blue-50)' }}
                                        >
                                            NDVI
                                        </span>
                                        <span
                                            className="text-xs"
                                            style={{
                                                color: 'var(--custom-light-blue)',
                                                fontVariantNumeric: 'tabular-nums',
                                            }}
                                        >
                                            {ndvi}
                                        </span>
                                    </div>

                                    {/* Coordinates */}
                                    <div
                                        className="text-xs"
                                        style={{ color: 'var(--custom-light-blue-50)' }}
                                    >
                                        {Math.abs(result.lat).toFixed(5)}°
                                        {result.lat >= 0 ? 'N' : 'S'}
                                        {', '}
                                        {Math.abs(result.lon).toFixed(5)}°
                                        {result.lon >= 0 ? 'E' : 'W'}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
