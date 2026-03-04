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

import React, { FC, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import MapView from '@arcgis/core/views/MapView';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import { LineChartBasic } from '@vannizhang/react-d3-charts';
import {
    LineChartDataItem,
    VerticalReferenceLineData,
} from '@vannizhang/react-d3-charts/dist/LineChart/types';
import { MapActionButton } from '@shared/components/MapActionButton/MapActionButton';
import { CalciteIcon } from '@esri/calcite-components-react';
import {
    fetchNDVITimeSeries,
    getDefaultStartDate,
    getDefaultEndDate,
    NDVIDataPoint,
    IndexType,
    LinearRegression,
    HarmonicRegressionResult,
    fitHarmonicRegression,
} from '@shared/services/ndvi-timeseries/helpers';
import {
    detectSingleBand,
    dateToOrdinal,
    evaluateSegment,
    CCDCResult,
} from '@shared/utils/ccdc/ccdc';
import { formatInUTCTimeZone } from '@shared/utils/date-time/formatInUTCTimeZone';
import {
    useAppDispatch,
    useAppSelector,
} from '@shared/store/configureStore';
import {
    modeChanged,
    shouldForceSceneReselectionUpdated,
} from '@shared/store/ImageryScene/reducer';
import { bottomPanelToggled } from '@shared/store/UI/reducer';
import {
    updateAcquisitionDate,
    updateRasterFunctionName,
} from '@shared/store/ImageryScene/thunks';
import { selectQueryParams4SceneInSelectedMode } from '@shared/store/ImageryScene/selectors';

/** Default Sentinel-2 renderer used when none is currently selected. */
const DEFAULT_RASTER_FUNCTION = 'Natural Color for Visualization';

/** Sentinel-2 data begins on this date. Earlier start dates switch to Landsat. */
const SENTINEL2_LAUNCH_DATE = '2015-06-23';

// ── Types ─────────────────────────────────────────────────────────────────────

type ClickedLocation = { lat: number; lon: number };

/** How raw data is aggregated for display. 'raw' shows every observation. */
type AggMode = 'raw' | 'mean' | 'min' | 'max';

/** Active curve model overlaid on the chart. */
type ModelType = 'none' | 'linear' | 'harmonic' | 'ccdc';

/** Pixel extents of an in-progress drag-to-select on the chart. */
type DragSel = { startPx: number; endPx: number };

type Props = {
    mapView?: MapView;
    /** Called whenever the tool's active state changes. */
    onIsActiveChange?: (active: boolean) => void;
    /** Called when the user clicks a map point (geographic + screen coords). */
    onMapClick?: (lat: number, lon: number, screenX: number, screenY: number) => void;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_PANEL_WIDTH = 360;
const MAX_PANEL_WIDTH = 1600;
const DEFAULT_PANEL_WIDTH = 480;
const MIN_CHART_HEIGHT = 100;
const MAX_CHART_HEIGHT = 600;
const DEFAULT_CHART_HEIGHT = 200;

/**
 * Pixels-per-month threshold above which month labels are shown on the x-axis.
 * "MMM yyyy" needs at least ~55 px to avoid overlap.
 */
const MONTH_LABEL_THRESHOLD_PX = 55;

/**
 * Minimum pixels per day to show day-level tick marks.
 */
const DAY_TICK_THRESHOLD_PX = 5;

/** Chart left+right margins (determines inner drawing width from panel width). */
const CHART_MARGIN_H = 60; // left 45 + right 15

// ── Pure data helpers ─────────────────────────────────────────────────────────

/** Convert raw NDVI data to chart items. No clamping — y-axis domain handles display range. */
const ndviToChartData = (data: NDVIDataPoint[]): LineChartDataItem[] =>
    data
        .filter((d) => d.date)
        .map((d) => ({
            x: new Date(d.date).getTime(),
            y: d.ndvi,
            tooltip: `${new Date(d.date).toLocaleDateString(undefined, { timeZone: 'UTC' })}: ${d.ndvi.toFixed(3)}`,
        }))
        .sort((a, b) => a.x - b.x);

/** Short month names for tooltip labels. */
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/**
 * Aggregate raw NDVI data by calendar month (UTC).
 * Each output point is placed at the 15th of the month.
 */
const aggregateByMonth = (
    data: NDVIDataPoint[],
    mode: 'mean' | 'min' | 'max'
): LineChartDataItem[] => {
    const buckets = new Map<string, { year: number; month: number; vals: number[] }>();

    for (const d of data) {
        if (!d.date) continue;
        const yearMonth = d.date.substring(0, 7);
        const year = +yearMonth.substring(0, 4);
        const month = +yearMonth.substring(5, 7) - 1;
        const key = yearMonth;
        if (!buckets.has(key)) buckets.set(key, { year, month, vals: [] });
        buckets.get(key)!.vals.push(d.ndvi);
    }

    const points: LineChartDataItem[] = [];
    for (const { year, month, vals } of buckets.values()) {
        const x = Date.UTC(year, month, 15);
        const y =
            mode === 'mean'
                ? vals.reduce((a, b) => a + b, 0) / vals.length
                : mode === 'max'
                ? Math.max(...vals)
                : Math.min(...vals);
        points.push({
            x,
            y,
            tooltip: `${MONTH_ABBR[month]} ${year}: ${y.toFixed(3)} (n=${vals.length})`,
        });
    }

    return points.sort((a, b) => a.x - b.x);
};

// ── Shared button style helper ─────────────────────────────────────────────────

const pillStyle = (active: boolean, activeColor: string): React.CSSProperties => ({
    fontSize: 11,
    padding: '1px 10px',
    borderRadius: 10,
    border: active ? `1px solid ${activeColor}` : '1px solid var(--custom-light-blue-25)',
    background: active ? `${activeColor}26` : 'transparent',
    color: active ? activeColor : 'var(--custom-light-blue-50)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
});

// ── Component ─────────────────────────────────────────────────────────────────

export const NDVITimeSeriesControl: FC<Props> = ({ mapView, onIsActiveChange, onMapClick }) => {
    const [isActive, setIsActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useState<ClickedLocation | null>(null);
    const [ndviData, setNdviData] = useState<NDVIDataPoint[]>([]);
    // Compute linear regression client-side from raw observations using OLS
    const linearRegression = useMemo<LinearRegression | null>(() => {
        const rawData = ndviToChartData(ndviData);
        if (rawData.length < 2) return null;
        const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
        const firstX = rawData[0].x;
        const n = rawData.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (const pt of rawData) {
            const t = (pt.x - firstX) / MS_PER_YEAR;
            sumX += t; sumY += pt.y; sumXY += t * pt.y; sumX2 += t * t;
        }
        const denom = n * sumX2 - sumX * sumX;
        if (Math.abs(denom) < 1e-12) return null;
        const slope = (n * sumXY - sumX * sumY) / denom;
        const intercept = (sumY - slope * sumX) / n;
        const spanYears = (rawData[rawData.length - 1].x - firstX) / MS_PER_YEAR;
        return { y1: intercept, y2: intercept + slope * spanYears, slope, intercept };
    }, [ndviData]);
    const [activeModel, setActiveModel] = useState<ModelType>('none');
    const [startDate, setStartDate] = useState(getDefaultStartDate);
    const [endDate, setEndDate] = useState(getDefaultEndDate);
    const [error, setError] = useState<string | null>(null);
    const [aggMode, setAggMode] = useState<AggMode>('raw');
    const [indexType, setIndexType] = useState<IndexType>('ndvi');
    const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
    const [chartHeight, setChartHeight] = useState(DEFAULT_CHART_HEIGHT);
    const [dragSel, setDragSel] = useState<DragSel | null>(null);
    const [showData, setShowData] = useState(true);
    /** Which satellite sensor the currently displayed data came from. */
    const [dataSource, setDataSource] = useState<'sentinel2' | 'landsat'>('sentinel2');

    // Custom y-axis domain overrides — null means "use auto-computed value"
    const [customYMin, setCustomYMin] = useState<number | null>(null);
    const [customYMax, setCustomYMax] = useState<number | null>(null);
    // Which y-axis boundary is being inline-edited right now
    const [editingYMin, setEditingYMin] = useState(false);
    const [editingYMax, setEditingYMax] = useState(false);

    const clickHandlerRef = useRef<__esri.Handle | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const markerGraphicRef = useRef<Graphic | null>(null);

    // Stable refs so resize/drag callbacks never need to be re-created.
    const sizeRef = useRef({ width: DEFAULT_PANEL_WIDTH, height: DEFAULT_CHART_HEIGHT });
    sizeRef.current = { width: panelWidth, height: chartHeight };

    // Stable refs for values read inside stable callbacks.
    const activeModelRef = useRef<ModelType>(activeModel);
    activeModelRef.current = activeModel;
    const ndviDataRef = useRef<NDVIDataPoint[]>(ndviData);
    ndviDataRef.current = ndviData;
    const aggModeRef = useRef<AggMode>(aggMode);
    aggModeRef.current = aggMode;
    // Stable ref for the parent callback — keeps the click handler effect stable.
    const onMapClickRef = useRef(onMapClick);
    onMapClickRef.current = onMapClick;

    // Redux integration — used to load a Sentinel-2 scene on chart click.
    const dispatch = useAppDispatch();
    const queryParams = useAppSelector(selectQueryParams4SceneInSelectedMode);
    const queryParamsRef = useRef(queryParams);
    queryParamsRef.current = queryParams;

    // ── Map marker ────────────────────────────────────────────────────────────

    const showPointOnMap = useCallback(
        (lat: number, lon: number) => {
            if (!mapView) return;
            // Remove previous marker. Using mapView.graphics ensures the marker
            // is always rendered above all imagery layers, so it won't be covered
            // when the current scene changes and a new imagery layer is added.
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

    // ── Data fetching ─────────────────────────────────────────────────────────

    const fetchData = useCallback(
        async (
            lat: number,
            lon: number,
            start: string,
            end: string,
            index: IndexType = 'ndvi'
        ) => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
            abortControllerRef.current = new AbortController();
            setIsLoading(true);
            setError(null);
            try {
                const isLandsat = start < SENTINEL2_LAUNCH_DATE;
                const sensor = isLandsat ? '5+7+8+9' : undefined;
                const result = await fetchNDVITimeSeries(lat, lon, start, end, index, false, sensor);
                setNdviData(result.data);
                setDataSource(isLandsat ? 'landsat' : 'sentinel2');
                if (result.data.length === 0)
                    setError('No data returned for this location and date range.');
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error('NDVI fetch error:', err);
                    setError('Failed to fetch NDVI data. Please try again.');
                }
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    // ── Map click handler ─────────────────────────────────────────────────────

    useEffect(() => {
        if (!mapView || !isActive) {
            clickHandlerRef.current?.remove();
            clickHandlerRef.current = null;
            return;
        }
        clickHandlerRef.current = mapView.on('click', (event) => {
            event.stopPropagation();
            const { latitude, longitude } = event.mapPoint;
            const lat = Math.round(latitude * 1e6) / 1e6;
            const lon = Math.round(longitude * 1e6) / 1e6;
            const screenX = (event.native as MouseEvent).clientX;
            const screenY = (event.native as MouseEvent).clientY;
            setLocation({ lat, lon });
            showPointOnMap(lat, lon);
            fetchData(lat, lon, startDate, endDate, indexType);
            onMapClickRef.current?.(lat, lon, screenX, screenY);
        });
        return () => {
            clickHandlerRef.current?.remove();
            clickHandlerRef.current = null;
        };
    }, [mapView, isActive, startDate, endDate, indexType, fetchData, showPointOnMap]);

    // ── Clean up on deactivate ────────────────────────────────────────────────

    useEffect(() => {
        if (!isActive) {
            if (markerGraphicRef.current && mapView) {
                mapView.graphics.remove(markerGraphicRef.current);
                markerGraphicRef.current = null;
            }
            setLocation(null);
            setNdviData([]);
            setActiveModel('none');
            setError(null);
        }
    }, [isActive, mapView]);

    // ── Notify parent when active state changes ───────────────────────────────

    useEffect(() => {
        onIsActiveChange?.(isActive);
    }, [isActive, onIsActiveChange]);

    // ── Re-fetch when index type changes (if a location is already loaded) ────
    const prevIndexRef = useRef<IndexType>(indexType);
    useEffect(() => {
        if (prevIndexRef.current === indexType) return;
        prevIndexRef.current = indexType;
        if (location && isActive) {
            fetchData(location.lat, location.lon, startDate, endDate, indexType);
        }
    }, [indexType, location, isActive, startDate, endDate, fetchData]);

    // ── Panel resize ──────────────────────────────────────────────────────────

    const startResize = useCallback(
        (type: 'right' | 'corner') => (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const startW = sizeRef.current.width;
            const startH = sizeRef.current.height;

            const onMove = (ev: MouseEvent) => {
                if (type === 'right' || type === 'corner') {
                    setPanelWidth(
                        Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, startW + ev.clientX - startX))
                    );
                }
                if (type === 'corner') {
                    setChartHeight(
                        Math.max(MIN_CHART_HEIGHT, Math.min(MAX_CHART_HEIGHT, startH + ev.clientY - startY))
                    );
                }
            };
            const onUp = () => {
                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.body.style.userSelect = 'none';
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        },
        []
    );

    // ── Derived chart data ────────────────────────────────────────────────────

    const chartData = useMemo<LineChartDataItem[]>(() => {
        if (ndviData.length === 0) return [];
        if (aggMode === 'raw') return ndviToChartData(ndviData);
        return aggregateByMonth(ndviData, aggMode);
    }, [ndviData, aggMode]);

    // ── Data statistics (range, mean, std of displayed series) ───────────────

    const dataStats = useMemo(() => {
        if (chartData.length === 0) return null;
        const vals = chartData.map((pt) => pt.y);
        const n = vals.length;
        const mean = vals.reduce((a, b) => a + b, 0) / n;
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
        return { mean, min, max, range: max - min, std };
    }, [chartData]);

    // ── Model fits ────────────────────────────────────────────────────────────

    /** Harmonic regression curve — always computed from raw observations so it
     *  is unaffected by the current aggregation mode. */
    const harmonicFit = useMemo<HarmonicRegressionResult | null>(() => {
        const rawData = ndviToChartData(ndviData);
        if (activeModel !== 'harmonic' || rawData.length < 8) return null;
        return fitHarmonicRegression(rawData, 2);
    }, [activeModel, ndviData]);

    /** CCDC change-detection result — runs full algorithm on raw observations. */
    const ccdcResult = useMemo<CCDCResult | null>(() => {
        const rawData = ndviToChartData(ndviData);
        if (activeModel !== 'ccdc' || rawData.length < 12) return null;
        const dates = rawData.map((pt) => dateToOrdinal(new Date(pt.x)));
        const values = rawData.map((pt) => pt.y);
        return detectSingleBand(dates, values);
    }, [activeModel, ndviData]);

    /** RMSE of the linear regression fit — always computed against raw observations
     *  so the value is unaffected by the current aggregation mode. */
    const linearRMSE = useMemo<number | null>(() => {
        if (!linearRegression) return null;
        const rawData = ndviToChartData(ndviData);
        if (rawData.length < 2) return null;
        const firstX = rawData[0].x;
        const lastX = rawData[rawData.length - 1].x;
        const spanX = lastX - firstX;
        if (spanX === 0) return null;
        let sse = 0;
        if (linearRegression.slope !== undefined && linearRegression.intercept !== undefined) {
            const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
            for (const pt of rawData) {
                const tYears = (pt.x - firstX) / MS_PER_YEAR;
                const yFit = linearRegression.intercept + linearRegression.slope * tYears;
                sse += (pt.y - yFit) ** 2;
            }
        } else {
            for (const pt of rawData) {
                const t = (pt.x - firstX) / spanX;
                const yFit = linearRegression.y1 + t * (linearRegression.y2 - linearRegression.y1);
                sse += (pt.y - yFit) ** 2;
            }
        }
        return Math.sqrt(sse / rawData.length);
    }, [linearRegression, ndviData]);

    // ── Drag-to-select date range ─────────────────────────────────────────────

    const handleChartMouseDown = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (chartData.length < 2) return;

            const rect = e.currentTarget.getBoundingClientRect();
            const innerW = rect.width - 45 - 15;
            const clamp = (px: number) => Math.max(0, Math.min(innerW, px));
            const startPx = clamp(e.clientX - rect.left - 45);

            setDragSel({ startPx, endPx: startPx });

            const onMove = (ev: MouseEvent) => {
                setDragSel({ startPx, endPx: clamp(ev.clientX - rect.left - 45) });
            };

            const onUp = (ev: MouseEvent) => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                document.body.style.userSelect = '';

                const endPx = clamp(ev.clientX - rect.left - 45);
                setDragSel(null);

                if (Math.abs(endPx - startPx) < 5) {
                    // Plain click → find the closest data point (using raw observations
                    // when in an aggregated mode so we can load an actual Sentinel-2 scene).
                    const minTime = chartData[0].x;
                    const maxTime = chartData[chartData.length - 1].x;
                    const clickTime = minTime + (startPx / innerW) * (maxTime - minTime);

                    // In aggregated modes the chartData points are monthly centroids and
                    // don't correspond to actual acquisition dates — search raw ndviData instead.
                    const rawData = aggModeRef.current !== 'raw' && ndviDataRef.current.length > 0
                        ? ndviToChartData(ndviDataRef.current)
                        : chartData;

                    const closest = rawData.reduce((prev, curr) =>
                        Math.abs(curr.x - clickTime) < Math.abs(prev.x - clickTime) ? curr : prev
                    );

                    const clickedDate = new Date(closest.x).toISOString().substring(0, 10);

                    // Ensure the bottom panel is visible so that CalendarContainer
                    // (which runs useFindSelectedSceneByDate) is mounted and can
                    // respond to the acquisitionDate + forceReselection changes below.
                    dispatch(bottomPanelToggled(false));
                    dispatch(modeChanged('find a scene'));
                    if (!queryParamsRef.current?.rasterFunctionName) {
                        dispatch(updateRasterFunctionName(DEFAULT_RASTER_FUNCTION));
                    }
                    dispatch(shouldForceSceneReselectionUpdated(true));
                    dispatch(updateAcquisitionDate(clickedDate, true));
                    return;
                }

                const minPx = Math.min(startPx, endPx);
                const maxPx = Math.max(startPx, endPx);
                const minTime = chartData[0].x;
                const maxTime = chartData[chartData.length - 1].x;

                const t1 = minTime + (minPx / innerW) * (maxTime - minTime);
                const t2 = minTime + (maxPx / innerW) * (maxTime - minTime);
                const newStart = new Date(t1).toISOString().substring(0, 10);
                const newEnd   = new Date(t2).toISOString().substring(0, 10);

                setStartDate(newStart);
                setEndDate(newEnd);
                if (location) {
                    fetchData(location.lat, location.lon, newStart, newEnd, indexType);
                }
            };

            document.body.style.userSelect = 'none';
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        },
        [chartData, location, indexType, fetchData, dispatch]
    );

    // ── Y-axis domain ─────────────────────────────────────────────────────────

    const computedYMin = useMemo(() => {
        if (ndviData.length === 0) return 0;
        const dataMin = Math.min(...ndviData.map((d) => d.ndvi));
        return Math.min(0, Math.floor(dataMin * 10) / 10);
    }, [ndviData]);

    const computedYMax = useMemo(() => {
        if (ndviData.length === 0) return 1;
        const dataMax = Math.max(...ndviData.map((d) => d.ndvi));
        return Math.max(1, Math.ceil(dataMax * 10) / 10);
    }, [ndviData]);

    // Apply user overrides; fall back to auto-computed values
    const effectiveYMin = customYMin ?? computedYMin;
    const effectiveYMax = customYMax ?? computedYMax;
    const yDomain: [number, number] = [effectiveYMin, effectiveYMax];

    // Reset custom overrides and editing state whenever a new dataset arrives
    useEffect(() => {
        setCustomYMin(null);
        setCustomYMax(null);
        setEditingYMin(false);
        setEditingYMax(false);
    }, [ndviData]);

    /**
     * Fixed x domain derived from raw observation timestamps.
     * Shared across all aggregation modes so the chart's x scale does not
     * shift when switching between Raw, Mean, Min, and Max views.
     */
    const fixedXDomain = useMemo<[number, number] | undefined>(() => {
        if (ndviData.length === 0) return undefined;
        const times = ndviData
            .map((d) => (d.date ? new Date(d.date).getTime() : NaN))
            .filter((t) => !isNaN(t));
        if (times.length === 0) return undefined;
        return [Math.min(...times), Math.max(...times)];
    }, [ndviData]);

    /** Number of calendar years spanned by the current dataset, e.g. "10 years". */
    const yearRange = useMemo<string | null>(() => {
        if (ndviData.length === 0) return null;
        const years = ndviData
            .map((d) => (d.date ? +d.date.substring(0, 4) : NaN))
            .filter((y) => !isNaN(y));
        if (years.length === 0) return null;
        const numYears = Math.max(...years) - Math.min(...years) + 1;
        return numYears === 1 ? '1 year' : `${numYears} years`;
    }, [ndviData]);

    // ── X-axis helpers ────────────────────────────────────────────────────────

    /** Time span of the currently displayed data in months. */
    const spanMonths = useMemo(() => {
        if (chartData.length < 2) return 0;
        const spanMs = chartData[chartData.length - 1].x - chartData[0].x;
        return spanMs / (1000 * 60 * 60 * 24 * 30.44);
    }, [chartData]);

    /**
     * Whether to show "MMM yyyy" month labels instead of year-only labels.
     * True when the panel is wide enough to give each month ≥ MONTH_LABEL_THRESHOLD_PX.
     */
    const showMonthLabels = useMemo(() => {
        if (spanMonths <= 0) return false;
        const innerWidth = panelWidth - CHART_MARGIN_H;
        return innerWidth / spanMonths >= MONTH_LABEL_THRESHOLD_PX;
    }, [spanMonths, panelWidth]);

    /**
     * Whether to show day-level tick marks on the x-axis.
     * True when the panel gives each day ≥ DAY_TICK_THRESHOLD_PX pixels.
     */
    const showDayTicks = useMemo(() => {
        if (spanMonths <= 0) return false;
        const innerWidth = panelWidth - CHART_MARGIN_H;
        const spanDays = spanMonths * 30.44;
        return spanDays > 0 && innerWidth / spanDays >= DAY_TICK_THRESHOLD_PX;
    }, [spanMonths, panelWidth]);

    /**
     * Number of x-axis ticks.
     * When showing month labels: capped by actual number of months so D3 won't
     * repeat the same label twice.
     * When showing year labels: one tick per year.
     */
    const xTickCount = useMemo(() => {
        if (showMonthLabels) {
            const pixelBased = Math.min(8, Math.floor((panelWidth - 84) / 70));
            const monthCount = Math.max(1, Math.round(spanMonths));
            return Math.min(pixelBased, monthCount);
        }
        if (chartData.length < 2) return 3;
        const yearSpan =
            new Date(chartData[chartData.length - 1].x).getUTCFullYear() -
            new Date(chartData[0].x).getUTCFullYear() +
            1;
        // Cap by available pixel width (~40 px per "yyyy" label) to avoid overlap on long series
        const pixelBased = Math.max(2, Math.floor((panelWidth - CHART_MARGIN_H) / 40));
        return Math.min(pixelBased, yearSpan);
    }, [showMonthLabels, spanMonths, panelWidth, chartData]);

    /**
     * Persistent state for the x-axis tick label formatter.
     * Tracks the last-seen tick timestamp and year within a single D3 axis
     * render pass so we can emit a year label only when the year changes.
     *
     * NOTE: LineChartBasic does NOT forward `tickValues` to its BottomAxis
     * component, so we cannot use explicit tick arrays to control D3.
     * Instead we use numberOfTicks (which IS forwarded) and a smart formatter.
     */
    const xAxisLabelStateRef = useRef<{ lastTime: number; lastYear: number }>({
        lastTime: -1,
        lastYear: -1,
    });

    /**
     * Tick label formatter for the x-axis.
     *
     * Month mode – returns 'MMM yyyy' for every tick (ticks are monthly, so
     *              no two ticks share a label).
     *
     * Year mode  – returns the 4-digit year only for the FIRST tick that
     *              introduces each new calendar year; all other ticks return ''
     *              (keeping the tick mark but suppressing the text).
     *
     *              Stale-state detection: D3 calls this formatter left-to-right
     *              for every tick in a single render pass.  If the incoming
     *              timestamp is ≤ the last-seen timestamp, a new render pass
     *              has started (D3 is calling from tick 0 again), so we reset
     *              the tracking state before processing the tick.  This works
     *              for all axis update scenarios — data reload, date-range
     *              changes, or D3 internal transitions — because the first tick
     *              of any new pass will always be earlier (or equal) to the
     *              last tick of the previous pass.
     */
    const xTickFormatFunction = useMemo(() => {
        // Changing label mode → reset state so the new formatter starts clean.
        xAxisLabelStateRef.current = { lastTime: -1, lastYear: -1 };

        return (val: any) => {
            const time = +val;

            if (showMonthLabels) {
                return formatInUTCTimeZone(time, 'MMM yyyy');
            }

            // Year mode ─────────────────────────────────────────────────────
            // Detect a new D3 render pass (formatter called from tick 0 again).
            if (time <= xAxisLabelStateRef.current.lastTime) {
                xAxisLabelStateRef.current = { lastTime: -1, lastYear: -1 };
            }
            xAxisLabelStateRef.current.lastTime = time;

            const year = new Date(time).getUTCFullYear();
            if (year !== xAxisLabelStateRef.current.lastYear) {
                xAxisLabelStateRef.current.lastYear = year;
                return formatInUTCTimeZone(time, 'yyyy');
            }
            return '';
        };
    }, [showMonthLabels]);

    /**
     * Vertical reference lines.
     * - Zoomed out (year labels): one line per year boundary (Jan 1).
     * - Zoomed in (month labels): one line per month boundary.
     */
    const verticalReferenceLines = useMemo<VerticalReferenceLineData[] | undefined>(() => {
        if (chartData.length < 2) return undefined;
        const minTime = chartData[0].x;
        const maxTime = chartData[chartData.length - 1].x;
        const lines: VerticalReferenceLineData[] = [];

        if (showMonthLabels) {
            // Month boundaries
            const start = new Date(minTime);
            const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
            while (d.getTime() <= maxTime) {
                lines.push({ x: d.getTime() } as VerticalReferenceLineData);
                d.setUTCMonth(d.getUTCMonth() + 1);
            }
        } else {
            // Year boundaries
            const minYear = new Date(minTime).getUTCFullYear();
            const maxYear = new Date(maxTime).getUTCFullYear();
            for (let yr = minYear + 1; yr <= maxYear; yr++) {
                lines.push({ x: Date.UTC(yr, 0, 1) } as VerticalReferenceLineData);
            }
        }
        return lines.length > 0 ? lines : undefined;
    }, [chartData, showMonthLabels]);

    /**
     * Minor month tick positions (non-January boundaries) for SVG overlay.
     * Only used when year labels are shown (not month labels — the library
     * already provides fine ticks when showMonthLabels is true).
     */
    const monthTickPositions = useMemo<number[]>(() => {
        if (chartData.length < 2 || showMonthLabels) return [];
        const minTime = chartData[0].x;
        const maxTime = chartData[chartData.length - 1].x;
        const ticks: number[] = [];
        const start = new Date(minTime);
        const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
        while (d.getTime() < maxTime) {
            if (d.getUTCMonth() !== 0) ticks.push(d.getTime());
            d.setUTCMonth(d.getUTCMonth() + 1);
        }
        return ticks;
    }, [chartData, showMonthLabels]);

    /**
     * Day tick positions for SVG overlay — shown when very zoomed in.
     * Skips the 1st of each month (those are already marked by month boundaries).
     */
    const dayTickPositions = useMemo<number[]>(() => {
        if (!showDayTicks || chartData.length < 2) return [];
        const minTime = chartData[0].x;
        const maxTime = chartData[chartData.length - 1].x;
        const ticks: number[] = [];
        const d = new Date(minTime);
        d.setUTCDate(d.getUTCDate() + 1);
        d.setUTCHours(0, 0, 0, 0);
        while (d.getTime() < maxTime) {
            if (d.getUTCDate() !== 1) ticks.push(d.getTime());
            d.setUTCDate(d.getUTCDate() + 1);
        }
        return ticks;
    }, [showDayTicks, chartData]);

    // ── Render helpers ────────────────────────────────────────────────────────

    const aggModes: { key: AggMode; label: string; tooltip: string }[] = [
        { key: 'raw',  label: 'Raw',  tooltip: 'Show individual Sentinel-2 observations' },
        { key: 'mean', label: 'Mean', tooltip: 'Show monthly mean values' },
        { key: 'min',  label: 'Min',  tooltip: 'Show monthly minimum values' },
        { key: 'max',  label: 'Max',  tooltip: 'Show monthly maximum values' },
    ];

    const indexTooltips: Record<IndexType, string> = {
        ndvi: 'Normalized Difference Vegetation Index',
        evi:  'Enhanced Vegetation Index',
        nbr:  'Normalized Burn Ratio',
    };

    const hasData = !isLoading && !error && chartData.length > 0;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            {/* Toggle button in the map action button strip */}
            <MapActionButton
                tooltip={isActive ? 'Disable time series' : 'Show time series'}
                onClickHandler={() => setIsActive((v) => !v)}
                active={isActive}
                showLoadingIndicator={isLoading}
            >
                <CalciteIcon icon="graph-time-series" scale="s" />
            </MapActionButton>

            {/* Floating panel — only shown when active */}
            {isActive && (
                <div
                    className="fixed z-50 flex flex-col"
                    style={{
                        top: '80px',
                        left: '80px',
                        width: panelWidth,
                        background: 'var(--custom-background-95, rgba(30,30,30,0.97))',
                        border: '1px solid var(--custom-light-blue-25)',
                        borderRadius: '4px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
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
                            Time Series
                        </span>
                        <button
                            onClick={() => setIsActive(false)}
                            style={{ color: 'var(--custom-light-blue-50)', lineHeight: 1 }}
                            className="hover:text-white transition-colors"
                            title="Close"
                        >
                            <CalciteIcon icon="x" scale="s" />
                        </button>
                    </div>

                    {/* ── Date range row ── */}
                    <div className="flex items-center gap-2 px-3 py-2">
                        <label
                            className="text-xs"
                            style={{ color: 'var(--custom-light-blue-50)', minWidth: 30 }}
                        >
                            From
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            max={endDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && location) {
                                    const newStart = e.currentTarget.value;
                                    setStartDate(newStart);
                                    fetchData(location.lat, location.lon, newStart, endDate, indexType);
                                }
                            }}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--custom-light-blue-25)',
                                color: 'var(--custom-light-blue)',
                                borderRadius: 2,
                                padding: '2px 6px',
                                fontSize: 12,
                                colorScheme: 'dark',
                            }}
                        />
                        <label
                            className="text-xs"
                            style={{ color: 'var(--custom-light-blue-50)', minWidth: 16 }}
                        >
                            To
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            min={startDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && location) {
                                    const newEnd = e.currentTarget.value;
                                    setEndDate(newEnd);
                                    fetchData(location.lat, location.lon, startDate, newEnd, indexType);
                                }
                            }}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--custom-light-blue-25)',
                                color: 'var(--custom-light-blue)',
                                borderRadius: 2,
                                padding: '2px 6px',
                                fontSize: 12,
                                colorScheme: 'dark',
                            }}
                        />
                        <button
                            onClick={() => {
                                const fullStart = '2015-06-23';
                                const fullEnd = new Date().toISOString().substring(0, 10);
                                setStartDate(fullStart);
                                setEndDate(fullEnd);
                                if (location) {
                                    fetchData(location.lat, location.lon, fullStart, fullEnd, indexType);
                                }
                            }}
                            title="Reset to full Sentinel-2 time range (Jun 2015 – today)"
                            style={{
                                fontSize: 11,
                                padding: '1px 8px',
                                borderRadius: 10,
                                border: '1px solid var(--custom-light-blue-25)',
                                background: 'transparent',
                                color: 'var(--custom-light-blue-50)',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Reset
                        </button>
                        {location && (
                            <button
                                onClick={() =>
                                    fetchData(location.lat, location.lon, startDate, endDate, indexType)
                                }
                                disabled={isLoading}
                                title="Refetch the data from the server"
                                style={{
                                    marginLeft: 'auto',
                                    color: 'var(--custom-light-blue)',
                                    opacity: isLoading ? 0.4 : 1,
                                    cursor: isLoading ? 'default' : 'pointer',
                                }}
                            >
                                <CalciteIcon icon="refresh" scale="s" />
                            </button>
                        )}
                    </div>

                    {/* ── Index row — buttons left, coord + n= right ── */}
                    <div
                        className="flex items-center gap-2 px-3 pb-2"
                        style={{ borderBottom: '1px solid var(--custom-light-blue-25)' }}
                    >
                        <span
                            className="text-xs"
                            style={{ color: 'var(--custom-light-blue-50)', minWidth: 36 }}
                        >
                            Index
                        </span>
                        {(['ndvi', 'evi', 'nbr'] as IndexType[]).map((idx) => (
                            <button
                                key={idx}
                                onClick={() => setIndexType(idx)}
                                title={indexTooltips[idx]}
                                style={pillStyle(indexType === idx, '#05CB63')}
                            >
                                {idx.toUpperCase()}
                            </button>
                        ))}
                        {hasData && location && (
                            <>
                                <span
                                    className="ml-auto"
                                    style={{ fontSize: 11, color: 'var(--custom-light-blue-50)' }}
                                >
                                    {Math.abs(location.lat).toFixed(4)}°{location.lat >= 0 ? 'N' : 'S'},{' '}
                                    {Math.abs(location.lon).toFixed(4)}°{location.lon >= 0 ? 'E' : 'W'}
                                </span>
                                <span
                                    style={{ fontSize: 11, color: 'var(--custom-light-blue-50)' }}
                                    title="Total number of raw observations"
                                >
                                    n&nbsp;=&nbsp;{ndviData.length}{yearRange ? ` (${yearRange})` : ''}
                                </span>
                                <span
                                    title={dataSource === 'landsat' ? 'Using Landsat 5/7/8/9 (start date before Sentinel-2 launch)' : 'Using Sentinel-2'}
                                    style={{
                                        fontSize: 10,
                                        padding: '1px 6px',
                                        borderRadius: 8,
                                        border: `1px solid ${dataSource === 'landsat' ? '#F59E0B44' : 'var(--custom-light-blue-25)'}`,
                                        color: dataSource === 'landsat' ? '#F59E0B' : 'var(--custom-light-blue-50)',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {dataSource === 'landsat' ? 'Landsat' : 'Sentinel-2'}
                                </span>
                            </>
                        )}
                    </div>

                    {/* ── Body ── */}
                    <div className="px-3 pb-3">
                        {!location && (
                            <div
                                className="flex items-center justify-center text-xs py-8"
                                style={{ color: 'var(--custom-light-blue-50)' }}
                            >
                                Click anywhere on the map to load time series
                            </div>
                        )}

                        {location && (
                            <>
                                {isLoading && (
                                    <div
                                        className="flex items-center justify-center text-xs py-10"
                                        style={{ color: 'var(--custom-light-blue-50)' }}
                                    >
                                        Loading…
                                    </div>
                                )}

                                {!isLoading && error && (
                                    <div
                                        className="text-xs py-6 text-center"
                                        style={{ color: '#ff8888' }}
                                    >
                                        {error}
                                    </div>
                                )}

                                {hasData && (
                                    <>
                                    {/* Suppress pointer events on vertical reference line groups so the
                                        D3 crosshair/tooltip continues to fire normally.
                                        Also clip the D3 chart SVG so the data line cannot escape the
                                        plot area — without touching the HTML tooltip div which sits
                                        alongside the SVG and must be able to overflow upward. */}
                                    <style>{`
                                        .vertical-reference-line-group { pointer-events: none !important; }
                                        .ndvi-chart-wrap > svg:first-of-type { overflow: hidden; }
                                    `}</style>

                                    {/* ── Chart ── */}
                                    <div
                                        className="ndvi-chart-wrap"
                                        style={{
                                            height: chartHeight,
                                            position: 'relative',
                                            cursor: 'crosshair',
                                            marginTop: 7,
                                            '--axis-tick-line-color': 'var(--custom-light-blue-50)',
                                            '--axis-tick-text-color': 'var(--custom-light-blue-50)',
                                            '--crosshair-reference-line-color': 'var(--custom-light-blue-50)',
                                            '--vertical-reference-line-color': 'var(--custom-light-blue-10)',
                                            '--vertical-reference-line-width': '1',
                                            '--tooltip-text-font-size': '.725rem',
                                            '--tooltip-text-color': 'var(--custom-light-blue-70)',
                                            '--tooltip-background-color': 'var(--custom-background-95)',
                                            '--tooltip-border-color': 'var(--custom-light-blue-50)',
                                        } as React.CSSProperties}
                                        onMouseDown={handleChartMouseDown}
                                    >
                                        <LineChartBasic
                                            data={chartData}
                                            showTooltip
                                            stroke={showData ? '#05CB63' : 'transparent'}
                                            strokeWidth={1.5}
                                            margin={{ bottom: 30, left: 45, right: 15, top: 10 }}
                                            yScaleOptions={{ domain: yDomain }}
                                            xScaleOptions={{ useTimeScale: true, ...(fixedXDomain ? { domain: fixedXDomain } : {}) }}
                                            bottomAxisOptions={{
                                                numberOfTicks: xTickCount,
                                                tickFormatFunction: xTickFormatFunction,
                                            }}
                                            verticalReferenceLines={verticalReferenceLines}
                                        />

                                        {/* SVG overlay — linear regression, harmonic curve, month ticks, day ticks */}
                                        {(() => {
                                            const mLeft = 45, mRight = 15, mTop = 10, mBottom = 30;
                                            const containerW = panelWidth - 24;
                                            const innerW = containerW - mLeft - mRight;
                                            const innerH = chartHeight - mTop - mBottom;
                                            // Use the fixed raw-data domain so the overlay stays
                                            // aligned with the chart when switching aggregation modes.
                                            const minTime = fixedXDomain ? fixedXDomain[0] : chartData[0].x;
                                            const maxTime = fixedXDomain ? fixedXDomain[1] : chartData[chartData.length - 1].x;
                                            const xToPixel = (t: number) =>
                                                mLeft + ((t - minTime) / (maxTime - minTime)) * innerW;
                                            const yToPixel = (v: number) =>
                                                mTop + innerH - ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerH;
                                            const axisY = chartHeight - mBottom;

                                            // Show horizontal reference line at NDVI=0 whenever 0 is within the y-domain
                                            const has0Line = yDomain[0] <= 0 && yDomain[1] >= 0;

                                            const hasOverlay =
                                                has0Line ||
                                                (activeModel === 'linear' && linearRegression) ||
                                                (activeModel === 'harmonic' && harmonicFit) ||
                                                (activeModel === 'ccdc' && ccdcResult) ||
                                                monthTickPositions.length > 0 ||
                                                dayTickPositions.length > 0;

                                            if (!hasOverlay) return null;

                                            return (
                                                <svg
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        pointerEvents: 'none',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    {/* Horizontal reference line at NDVI = 0
                                                        Half the opacity of the vertical reference lines */}
                                                    {has0Line && (
                                                        <line
                                                            x1={mLeft}
                                                            y1={yToPixel(0)}
                                                            x2={mLeft + innerW}
                                                            y2={yToPixel(0)}
                                                            stroke="var(--custom-light-blue-10)"
                                                            strokeWidth={1}
                                                            opacity={0.5}
                                                        />
                                                    )}

                                                    {/* Linear regression line */}
                                                    {activeModel === 'linear' && linearRegression && (
                                                        <line
                                                            x1={mLeft}
                                                            y1={yToPixel(linearRegression.y1)}
                                                            x2={mLeft + innerW}
                                                            y2={yToPixel(linearRegression.y2)}
                                                            stroke="#FFB347"
                                                            strokeWidth={1.5}
                                                            strokeDasharray="5 4"
                                                            opacity={0.85}
                                                        />
                                                    )}

                                                    {/* Harmonic regression curve */}
                                                    {activeModel === 'harmonic' && harmonicFit && (
                                                        <path
                                                            d={harmonicFit.curve
                                                                .map((pt, i) =>
                                                                    `${i === 0 ? 'M' : 'L'}${xToPixel(pt.x).toFixed(1)},${yToPixel(pt.y).toFixed(1)}`
                                                                )
                                                                .join(' ')}
                                                            stroke="#4ECDC4"
                                                            strokeWidth={1.5}
                                                            strokeDasharray="5 4"
                                                            fill="none"
                                                            opacity={0.85}
                                                        />
                                                    )}

                                                    {/* CCDC segment curves */}
                                                    {activeModel === 'ccdc' && ccdcResult && ccdcResult.segments.map((seg, i) => {
                                                        // Convert ordinal day numbers to JS timestamps (ms)
                                                        const MS_PER_DAY = 86_400_000;
                                                        const ORDINAL_EPOCH = 719_163; // ordinal of 1970-01-01
                                                        const segStartMs = (seg.startDay - ORDINAL_EPOCH) * MS_PER_DAY;
                                                        const segEndMs   = (seg.endDay   - ORDINAL_EPOCH) * MS_PER_DAY;
                                                        const clampedStart = Math.max(segStartMs, minTime);
                                                        const clampedEnd   = Math.min(segEndMs,   maxTime);
                                                        if (clampedStart >= clampedEnd) return null;

                                                        // Sample 120 points across the visible portion of this segment
                                                        const N = 120;
                                                        const step = (clampedEnd - clampedStart) / (N - 1);
                                                        const sampleMs  = Array.from({ length: N }, (_, j) => clampedStart + j * step);
                                                        const sampleOrd = sampleMs.map((ms) => Math.floor(ms / MS_PER_DAY) + ORDINAL_EPOCH);
                                                        const predicted  = evaluateSegment(seg, sampleOrd)[0]; // single band

                                                        const d = sampleMs
                                                            .map((ms, j) => `${j === 0 ? 'M' : 'L'}${xToPixel(ms).toFixed(1)},${yToPixel(predicted[j]).toFixed(1)}`)
                                                            .join(' ');

                                                        return (
                                                            <path
                                                                key={`ccdc-seg-${i}`}
                                                                d={d}
                                                                stroke="#A855F7"
                                                                strokeWidth={1.5}
                                                                fill="none"
                                                                opacity={0.85}
                                                            />
                                                        );
                                                    })}

                                                    {/* CCDC change break lines (red vertical at each detected break) */}
                                                    {activeModel === 'ccdc' && ccdcResult && ccdcResult.segments
                                                        .filter((seg) => seg.changeProbability > 0)
                                                        .map((seg, i) => {
                                                            const breakMs = (seg.breakDay - 719_163) * 86_400_000;
                                                            if (breakMs < minTime || breakMs > maxTime) return null;
                                                            const x = xToPixel(breakMs);
                                                            return (
                                                                <line
                                                                    key={`ccdc-break-${i}`}
                                                                    x1={x} y1={mTop}
                                                                    x2={x} y2={chartHeight - mBottom}
                                                                    stroke="#ef4444"
                                                                    strokeWidth={1}
                                                                    strokeDasharray="3 2"
                                                                    opacity={0.7}
                                                                />
                                                            );
                                                        })}

                                                    {/* Month minor ticks (when showing year labels) */}
                                                    {monthTickPositions.map((t) => (
                                                        <line
                                                            key={t}
                                                            x1={xToPixel(t)} y1={axisY}
                                                            x2={xToPixel(t)} y2={axisY + 4}
                                                            stroke="var(--custom-light-blue-50)"
                                                            strokeWidth={0.75}
                                                            opacity={0.55}
                                                        />
                                                    ))}

                                                    {/* Day minor ticks (when zoomed in far enough) */}
                                                    {dayTickPositions.map((t) => (
                                                        <line
                                                            key={t}
                                                            x1={xToPixel(t)} y1={axisY}
                                                            x2={xToPixel(t)} y2={axisY + 2}
                                                            stroke="var(--custom-light-blue-50)"
                                                            strokeWidth={0.5}
                                                            opacity={0.35}
                                                        />
                                                    ))}
                                                </svg>
                                            );
                                        })()}

                                        {/* ── Y-axis min/max interactive labels ──────────────────────
                                            These HTML elements sit on top of the SVG in the left margin
                                            area (0..44 px) at the top and bottom of the plot.  Clicking
                                            one opens an inline number input; Enter/blur confirms it.
                                            A custom value is shown in full-brightness to indicate the
                                            axis is no longer auto-scaled.  Resets when data reloads. */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: 44,
                                                height: '100%',
                                                pointerEvents: 'none',
                                            }}
                                        >
                                            {/* yMax label — top of the y-axis */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 10,
                                                    right: 1,
                                                    transform: 'translateY(-50%)',
                                                    pointerEvents: 'auto',
                                                }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                            >
                                                {editingYMax ? (
                                                    <input
                                                        type="number"
                                                        step="0.05"
                                                        defaultValue={effectiveYMax.toFixed(2)}
                                                        autoFocus
                                                        onFocus={(e) => e.target.select()}
                                                        style={{
                                                            width: 40,
                                                            background: 'var(--custom-background)',
                                                            border: '1px solid var(--custom-light-blue)',
                                                            color: 'var(--custom-light-blue)',
                                                            fontSize: 9,
                                                            padding: '0 2px',
                                                            textAlign: 'right',
                                                            outline: 'none',
                                                            borderRadius: 2,
                                                        }}
                                                        onBlur={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            if (!isNaN(val) && val > effectiveYMin) setCustomYMax(val);
                                                            setEditingYMax(false);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            e.stopPropagation();
                                                            if (e.key === 'Enter') {
                                                                const val = parseFloat(e.currentTarget.value);
                                                                if (!isNaN(val) && val > effectiveYMin) setCustomYMax(val);
                                                                setEditingYMax(false);
                                                            }
                                                            if (e.key === 'Escape') setEditingYMax(false);
                                                        }}
                                                    />
                                                ) : (
                                                    <span
                                                        onClick={() => setEditingYMax(true)}
                                                        title={customYMax != null ? `y-max: ${customYMax.toFixed(2)} (custom) — click to edit` : 'Click to set y-axis maximum'}
                                                        style={{
                                                            display: 'block',
                                                            fontSize: 9,
                                                            color: customYMax != null ? 'var(--custom-light-blue)' : 'var(--custom-light-blue-50)',
                                                            textAlign: 'right',
                                                            lineHeight: 1,
                                                            cursor: 'pointer',
                                                            paddingRight: 2,
                                                            textDecoration: 'underline dotted',
                                                            textUnderlineOffset: 2,
                                                        }}
                                                    >
                                                        {effectiveYMax.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* yMin label — bottom of the y-axis */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    bottom: 30,
                                                    right: 1,
                                                    transform: 'translateY(50%)',
                                                    pointerEvents: 'auto',
                                                }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                            >
                                                {editingYMin ? (
                                                    <input
                                                        type="number"
                                                        step="0.05"
                                                        defaultValue={effectiveYMin.toFixed(2)}
                                                        autoFocus
                                                        onFocus={(e) => e.target.select()}
                                                        style={{
                                                            width: 40,
                                                            background: 'var(--custom-background)',
                                                            border: '1px solid var(--custom-light-blue)',
                                                            color: 'var(--custom-light-blue)',
                                                            fontSize: 9,
                                                            padding: '0 2px',
                                                            textAlign: 'right',
                                                            outline: 'none',
                                                            borderRadius: 2,
                                                        }}
                                                        onBlur={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            if (!isNaN(val) && val < effectiveYMax) setCustomYMin(val);
                                                            setEditingYMin(false);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            e.stopPropagation();
                                                            if (e.key === 'Enter') {
                                                                const val = parseFloat(e.currentTarget.value);
                                                                if (!isNaN(val) && val < effectiveYMax) setCustomYMin(val);
                                                                setEditingYMin(false);
                                                            }
                                                            if (e.key === 'Escape') setEditingYMin(false);
                                                        }}
                                                    />
                                                ) : (
                                                    <span
                                                        onClick={() => setEditingYMin(true)}
                                                        title={customYMin != null ? `y-min: ${customYMin.toFixed(2)} (custom) — click to edit` : 'Click to set y-axis minimum'}
                                                        style={{
                                                            display: 'block',
                                                            fontSize: 9,
                                                            color: customYMin != null ? 'var(--custom-light-blue)' : 'var(--custom-light-blue-50)',
                                                            textAlign: 'right',
                                                            lineHeight: 1,
                                                            cursor: 'pointer',
                                                            paddingRight: 2,
                                                            textDecoration: 'underline dotted',
                                                            textUnderlineOffset: 2,
                                                        }}
                                                    >
                                                        {effectiveYMin.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Drag-to-select highlight rectangle */}
                                        {dragSel && Math.abs(dragSel.endPx - dragSel.startPx) > 2 && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    left: 45 + Math.min(dragSel.startPx, dragSel.endPx),
                                                    width: Math.abs(dragSel.endPx - dragSel.startPx),
                                                    top: 10,
                                                    bottom: 30,
                                                    background: 'rgba(5, 203, 99, 0.15)',
                                                    border: '1px solid rgba(5, 203, 99, 0.5)',
                                                    borderRadius: 2,
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                        )}
                                    </div>

                                    {/* Separator line below chart */}
                                    <div style={{ marginTop: 4, borderTop: '1px solid var(--custom-light-blue-25)' }} />

                                    {/* ── Data row: aggregation buttons + series stats ── */}
                                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                                        <span
                                            className="text-xs"
                                            style={{ color: 'var(--custom-light-blue-50)', minWidth: 36 }}
                                        >
                                            Data
                                        </span>
                                        {aggModes.map(({ key, label, tooltip }) => (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    if (aggMode === key && showData) {
                                                        setShowData(false);
                                                    } else {
                                                        setAggMode(key);
                                                        setShowData(true);
                                                    }
                                                }}
                                                title={aggMode === key && showData ? `${tooltip} — click to hide` : tooltip}
                                                style={pillStyle(aggMode === key && showData, '#05CB63')}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                        {showData && dataStats && (
                                            <span
                                                className="ml-auto"
                                                style={{ fontSize: 11, color: 'var(--custom-light-blue-50)', whiteSpace: 'nowrap' }}
                                                title="Min / Max / Range / Mean / Standard deviation of displayed series"
                                            >
                                                ↓{dataStats.min.toFixed(2)}&nbsp;↑{dataStats.max.toFixed(2)}&nbsp;·&nbsp;Δ{dataStats.range.toFixed(2)}&nbsp;·&nbsp;μ&nbsp;{dataStats.mean.toFixed(2)}&nbsp;·&nbsp;σ&nbsp;{dataStats.std.toFixed(2)}
                                            </span>
                                        )}
                                    </div>

                                    {/* ── Model row: model buttons + model stats ── */}
                                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                                        <span
                                            className="text-xs"
                                            style={{ color: 'var(--custom-light-blue-50)', minWidth: 36 }}
                                        >
                                            Model
                                        </span>

                                        {/* Linear button */}
                                        <button
                                            onClick={() => {
                                                const next: ModelType = activeModel === 'linear' ? 'none' : 'linear';
                                                setActiveModel(next);
                                            }}
                                            title={activeModel === 'linear' ? 'Hide linear trend line' : 'Fit linear regression on raw observations'}
                                            style={pillStyle(activeModel === 'linear', '#FFB347')}
                                        >
                                            Linear
                                        </button>

                                        {/* Harmonic button */}
                                        <button
                                            onClick={() => {
                                                const next: ModelType = activeModel === 'harmonic' ? 'none' : 'harmonic';
                                                setActiveModel(next);
                                            }}
                                            title={activeModel === 'harmonic' ? 'Hide harmonic model' : 'Fit harmonic regression on raw observations (annual + semi-annual cycles)'}
                                            style={pillStyle(activeModel === 'harmonic', '#4ECDC4')}
                                        >
                                            Harmonic
                                        </button>

                                        {/* CCDC button */}
                                        <button
                                            onClick={() => {
                                                const next: ModelType = activeModel === 'ccdc' ? 'none' : 'ccdc';
                                                setActiveModel(next);
                                            }}
                                            title={activeModel === 'ccdc' ? 'Hide CCDC segments' : 'Run Continuous Change Detection and Classification (CCDC) — detects structural breaks in the time series'}
                                            style={pillStyle(activeModel === 'ccdc', '#A855F7')}
                                        >
                                            CCDC
                                        </button>

                                        {/* Linear stats */}
                                        {activeModel === 'linear' && linearRegression?.slope !== undefined && (
                                            <span
                                                className="ml-auto"
                                                title="Linear regression equation and RMSE"
                                                style={{ fontSize: 11, color: '#FFB347', fontStyle: 'italic', whiteSpace: 'nowrap' }}
                                            >
                                                y&nbsp;=&nbsp;{linearRegression.slope.toFixed(3)}x&nbsp;{linearRegression.intercept! >= 0 ? '+' : '−'}&nbsp;{Math.abs(linearRegression.intercept!).toFixed(3)}
                                                {linearRMSE !== null && (
                                                    <span style={{ fontStyle: 'normal' }}>
                                                        &nbsp;·&nbsp;RMSE&nbsp;{linearRMSE.toFixed(3)}
                                                    </span>
                                                )}
                                            </span>
                                        )}

                                        {/* Harmonic stats */}
                                        {activeModel === 'harmonic' && harmonicFit && (
                                            <span
                                                className="ml-auto"
                                                title="Harmonic model goodness-of-fit"
                                                style={{ fontSize: 11, color: '#4ECDC4', whiteSpace: 'nowrap' }}
                                            >
                                                R²&nbsp;{harmonicFit.r2.toFixed(3)}&nbsp;·&nbsp;RMSE&nbsp;{harmonicFit.rmse.toFixed(3)}
                                            </span>
                                        )}

                                        {/* CCDC stats */}
                                        {activeModel === 'ccdc' && ccdcResult && (
                                            <span
                                                className="ml-auto"
                                                title="CCDC: number of stable segments and detected change breaks"
                                                style={{ fontSize: 11, color: '#A855F7', whiteSpace: 'nowrap' }}
                                            >
                                                {ccdcResult.segments.length}&nbsp;segment{ccdcResult.segments.length !== 1 ? 's' : ''}
                                                {ccdcResult.segments.filter((s) => s.changeProbability > 0).length > 0 && (
                                                    <>
                                                        &nbsp;·&nbsp;
                                                        {ccdcResult.segments.filter((s) => s.changeProbability > 0).length}&nbsp;break{ccdcResult.segments.filter((s) => s.changeProbability > 0).length !== 1 ? 's' : ''}
                                                    </>
                                                )}
                                            </span>
                                        )}

                                        {/* CCDC not enough data */}
                                        {activeModel === 'ccdc' && !ccdcResult && ndviData.length > 0 && ndviData.length < 12 && (
                                            <span
                                                className="ml-auto"
                                                style={{ fontSize: 11, color: '#A855F7', opacity: 0.6, whiteSpace: 'nowrap' }}
                                            >
                                                Need ≥ 12 observations
                                            </span>
                                        )}
                                    </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {/* Right-edge drag handle */}
                    <div
                        onMouseDown={startResize('right')}
                        title="Drag to resize panel width"
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: 6,
                            cursor: 'ew-resize',
                        }}
                    />

                    {/* Bottom-right corner resize (width + height) */}
                    <div
                        onMouseDown={startResize('corner')}
                        title="Drag to resize"
                        style={{
                            position: 'absolute',
                            right: 0,
                            bottom: 0,
                            width: 16,
                            height: 16,
                            cursor: 'nwse-resize',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'flex-end',
                            paddingRight: 2,
                            paddingBottom: 2,
                        }}
                    >
                        <svg width="10" height="10" viewBox="0 0 10 10" style={{ opacity: 0.35 }}>
                            <circle cx="8" cy="8" r="1.2" fill="currentColor" />
                            <circle cx="5" cy="8" r="1.2" fill="currentColor" />
                            <circle cx="8" cy="5" r="1.2" fill="currentColor" />
                        </svg>
                    </div>
                </div>
            )}
        </>
    );
};
