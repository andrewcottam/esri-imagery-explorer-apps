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
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
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
} from '@shared/services/ndvi-timeseries/helpers';
import { formatInUTCTimeZone } from '@shared/utils/date-time/formatInUTCTimeZone';
import {
    useAppDispatch,
    useAppSelector,
} from '@shared/store/configureStore';
import {
    modeChanged,
    shouldForceSceneReselectionUpdated,
} from '@shared/store/ImageryScene/reducer';
import {
    updateAcquisitionDate,
    updateRasterFunctionName,
} from '@shared/store/ImageryScene/thunks';
import { selectQueryParams4SceneInSelectedMode } from '@shared/store/ImageryScene/selectors';

/** Default Sentinel-2 renderer used when none is currently selected. */
const DEFAULT_RASTER_FUNCTION = 'Natural Color for Visualization';

// ── Types ─────────────────────────────────────────────────────────────────────

type ClickedLocation = { lat: number; lon: number };

/** How raw data is aggregated for display. 'raw' shows every observation. */
type AggMode = 'raw' | 'mean' | 'min' | 'max';

/** Pixel extents of an in-progress drag-to-select on the chart. */
type DragSel = { startPx: number; endPx: number };

type Props = { mapView?: MapView };

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_PANEL_WIDTH = 360;
const MAX_PANEL_WIDTH = 900;
const DEFAULT_PANEL_WIDTH = 480;
const MIN_CHART_HEIGHT = 100;
const MAX_CHART_HEIGHT = 600;
const DEFAULT_CHART_HEIGHT = 200;

/**
 * Pixels-per-month threshold above which month labels are shown on the x-axis.
 * "MMM yyyy" needs at least ~55 px to avoid overlap.
 */
const MONTH_LABEL_THRESHOLD_PX = 55;

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
            tooltip: `${d.date}: ${d.ndvi.toFixed(3)}`,
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
        // Use the ISO date string prefix directly ("YYYY-MM") to avoid
        // timezone-induced month drift when parsing bare date strings.
        const yearMonth = d.date.substring(0, 7); // "YYYY-MM"
        const year = +yearMonth.substring(0, 4);
        const month = +yearMonth.substring(5, 7) - 1; // 0-indexed
        const key = yearMonth; // unique per calendar month within each year
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

/**
 * Single-pass weighted 3-point smoother [0.25, 0.5, 0.25].
 * End-points are left unchanged.
 */
const smoothLine = (data: LineChartDataItem[]): LineChartDataItem[] => {
    if (data.length < 3) return data;
    return data.map((pt, i) => {
        if (i === 0 || i === data.length - 1) return pt;
        return {
            ...pt,
            y: 0.25 * data[i - 1].y + 0.5 * pt.y + 0.25 * data[i + 1].y,
        };
    });
};

// ── Component ─────────────────────────────────────────────────────────────────

export const NDVITimeSeriesControl: FC<Props> = ({ mapView }) => {
    const [isActive, setIsActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useState<ClickedLocation | null>(null);
    const [ndviData, setNdviData] = useState<NDVIDataPoint[]>([]);
    const [linearRegression, setLinearRegression] = useState<LinearRegression | null>(null);
    const [showTrendLine, setShowTrendLine] = useState(false);
    const [startDate, setStartDate] = useState(getDefaultStartDate);
    const [endDate, setEndDate] = useState(getDefaultEndDate);
    const [error, setError] = useState<string | null>(null);
    const [aggMode, setAggMode] = useState<AggMode>('raw');
    const [indexType, setIndexType] = useState<IndexType>('ndvi');
    const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
    const [chartHeight, setChartHeight] = useState(DEFAULT_CHART_HEIGHT);
    const [dragSel, setDragSel] = useState<DragSel | null>(null);

    const clickHandlerRef = useRef<__esri.Handle | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const graphicsLayerRef = useRef<GraphicsLayer | null>(null);

    // Stable ref so resize callbacks never need to be re-created when size changes.
    const sizeRef = useRef({ width: DEFAULT_PANEL_WIDTH, height: DEFAULT_CHART_HEIGHT });
    sizeRef.current = { width: panelWidth, height: chartHeight };

    // Stable ref for showTrendLine so the map-click handler always reads the
    // current value without needing to be re-registered when the toggle changes.
    const showTrendLineRef = useRef(showTrendLine);
    showTrendLineRef.current = showTrendLine;

    // Redux integration — used to load a Sentinel-2 scene when the user clicks
    // on a data point in the time-series chart.
    const dispatch = useAppDispatch();
    const queryParams = useAppSelector(selectQueryParams4SceneInSelectedMode);
    // Stable ref so the drag-handler closure always reads the latest value.
    const queryParamsRef = useRef(queryParams);
    queryParamsRef.current = queryParams;

    // ── Map marker ────────────────────────────────────────────────────────────

    const showPointOnMap = useCallback(
        (lat: number, lon: number) => {
            if (!mapView) return;
            if (!graphicsLayerRef.current) {
                graphicsLayerRef.current = new GraphicsLayer({ listMode: 'hide' });
                mapView.map.add(graphicsLayerRef.current);
            }
            graphicsLayerRef.current.removeAll();
            graphicsLayerRef.current.add(
                new Graphic({
                    geometry: new Point({ latitude: lat, longitude: lon }),
                    symbol: new SimpleMarkerSymbol({
                        style: 'circle',
                        color: [5, 203, 99, 220],
                        size: 12,
                        outline: { color: [255, 255, 255, 200], width: 1.5 },
                    }),
                })
            );
            // Keep the marker on top of any layers added after it (e.g. SCL).
            mapView.map.reorder(
                graphicsLayerRef.current,
                mapView.map.layers.length - 1
            );
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
            index: IndexType = 'ndvi',
            includeLinearRegression = false
        ) => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
            abortControllerRef.current = new AbortController();
            setIsLoading(true);
            setError(null);
            try {
                const result = await fetchNDVITimeSeries(lat, lon, start, end, index, includeLinearRegression);
                setNdviData(result.data);
                setLinearRegression(result.linearRegression ?? null);
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
            setLocation({ lat, lon });
            showPointOnMap(lat, lon);
            fetchData(lat, lon, startDate, endDate, indexType, showTrendLineRef.current);
        });
        return () => {
            clickHandlerRef.current?.remove();
            clickHandlerRef.current = null;
        };
    }, [mapView, isActive, startDate, endDate, indexType, fetchData, showPointOnMap]);

    // ── Clean up on deactivate ────────────────────────────────────────────────

    useEffect(() => {
        if (!isActive) {
            if (graphicsLayerRef.current) {
                graphicsLayerRef.current.removeAll();
                if (mapView) mapView.map.remove(graphicsLayerRef.current);
                graphicsLayerRef.current = null;
            }
            setLocation(null);
            setNdviData([]);
            setLinearRegression(null);
            setError(null);
        }
    }, [isActive, mapView]);

    // ── Re-fetch when index type changes (if a location is already loaded) ────
    const prevIndexRef = useRef<IndexType>(indexType);
    useEffect(() => {
        if (prevIndexRef.current === indexType) return;
        prevIndexRef.current = indexType;
        if (location && isActive) {
            fetchData(location.lat, location.lon, startDate, endDate, indexType, showTrendLineRef.current);
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
        [] // stable — reads size via sizeRef
    );

    // ── Derived chart data ────────────────────────────────────────────────────

    const chartData = useMemo<LineChartDataItem[]>(() => {
        if (ndviData.length === 0) return [];
        if (aggMode === 'raw') return ndviToChartData(ndviData);
        return smoothLine(aggregateByMonth(ndviData, aggMode));
    }, [ndviData, aggMode]);

    // ── Drag-to-select date range ─────────────────────────────────────────────

    const handleChartMouseDown = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (chartData.length < 2) return;

            const rect = e.currentTarget.getBoundingClientRect();
            // Inner chart area: left margin=45, right margin=15
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
                    // Plain click → find the closest data point and load that
                    // Sentinel-2 scene, switching to "find a scene" mode.
                    const minTime = chartData[0].x;
                    const maxTime = chartData[chartData.length - 1].x;
                    const clickTime =
                        minTime + (startPx / innerW) * (maxTime - minTime);
                    const closest = chartData.reduce((prev, curr) =>
                        Math.abs(curr.x - clickTime) <
                        Math.abs(prev.x - clickTime)
                            ? curr
                            : prev
                    );
                    // Convert timestamp → YYYY-MM-DD (data dates are UTC midnight)
                    const clickedDate = new Date(closest.x)
                        .toISOString()
                        .substring(0, 10);

                    // Switch to "find a scene" so the Calendar + year selector
                    // react to the date, and the imagery layer renders the scene.
                    dispatch(modeChanged('find a scene'));
                    // Fall back to Natural Color if no renderer is selected yet.
                    if (!queryParamsRef.current?.rasterFunctionName) {
                        dispatch(
                            updateRasterFunctionName(DEFAULT_RASTER_FUNCTION)
                        );
                    }
                    // Force scene re-selection so useFindSelectedSceneByDate
                    // doesn't skip the update when a scene is already locked.
                    dispatch(shouldForceSceneReselectionUpdated(true));
                    // Set the acquisition date and sync the year selector.
                    dispatch(updateAcquisitionDate(clickedDate, true));
                    return;
                }

                const minPx = Math.min(startPx, endPx);
                const maxPx = Math.max(startPx, endPx);
                const minTime = chartData[0].x;
                const maxTime = chartData[chartData.length - 1].x;

                // Convert pixel offsets → timestamps → ISO date strings
                const t1 = minTime + (minPx / innerW) * (maxTime - minTime);
                const t2 = minTime + (maxPx / innerW) * (maxTime - minTime);
                const newStart = new Date(t1).toISOString().substring(0, 10);
                const newEnd   = new Date(t2).toISOString().substring(0, 10);

                setStartDate(newStart);
                setEndDate(newEnd);
                if (location) {
                    fetchData(location.lat, location.lon, newStart, newEnd, indexType, showTrendLineRef.current);
                }
            };

            document.body.style.userSelect = 'none';
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        },
        [chartData, location, indexType, fetchData, dispatch]
    );

    // Dynamic y-axis — extend below -0.2 or above 1 when the data warrants it
    // (e.g. EVI can exceed 1.0 in dense canopy).
    const yMin = useMemo(() => {
        if (ndviData.length === 0) return -0.2;
        const dataMin = Math.min(...ndviData.map((d) => d.ndvi));
        return Math.min(-0.2, Math.floor(dataMin * 10) / 10);
    }, [ndviData]);

    const yMax = useMemo(() => {
        if (ndviData.length === 0) return 1;
        const dataMax = Math.max(...ndviData.map((d) => d.ndvi));
        return Math.max(1, Math.ceil(dataMax * 10) / 10);
    }, [ndviData]);

    const yDomain: [number, number] = [yMin, yMax];

    // Year-boundary vertical reference lines (Jan 1 of each year in range).
    const verticalReferenceLines = useMemo<VerticalReferenceLineData[] | undefined>(() => {
        if (chartData.length < 2) return undefined;
        const minYear = new Date(chartData[0].x).getUTCFullYear();
        const maxYear = new Date(chartData[chartData.length - 1].x).getUTCFullYear();
        const lines: VerticalReferenceLineData[] = [];
        for (let yr = minYear + 1; yr <= maxYear; yr++) {
            lines.push({ x: Date.UTC(yr, 0, 1) } as VerticalReferenceLineData);
        }
        return lines.length > 0 ? lines : undefined;
    }, [chartData]);

    // Adaptive x-axis label: show "MMM yyyy" when the panel is wide enough to fit month labels.
    const showMonthLabels = useMemo(() => {
        if (chartData.length < 2) return false;
        const spanMs = chartData[chartData.length - 1].x - chartData[0].x;
        const spanMonths = spanMs / (1000 * 60 * 60 * 24 * 30.44);
        const innerWidth = panelWidth - CHART_MARGIN_H;
        return spanMonths > 0 && innerWidth / spanMonths >= MONTH_LABEL_THRESHOLD_PX;
    }, [chartData, panelWidth]);

    // When showing year-only labels use the number of distinct years so each
    // year appears at most once.  When showing month labels, cap the tick count
    // so each label has at least 70 px — this prevents D3 from placing a tick
    // every month even when the panel is wide.
    const xTickCount = showMonthLabels
        ? Math.min(8, Math.floor((panelWidth - 84) / 70)) // 84 = 24px padding + 60px margins
        : chartData.length >= 2
        ? new Date(chartData[chartData.length - 1].x).getUTCFullYear() -
          new Date(chartData[0].x).getUTCFullYear() +
          1
        : 3;

    // Minor tick positions — one per month, skipping January (year boundaries
    // which the library's axis already marks with a taller tick + year label).
    // Used to draw small month tick marks on the x-axis via an SVG overlay.
    const monthTickPositions = useMemo<number[]>(() => {
        if (chartData.length < 2) return [];
        const minTime = chartData[0].x;
        const maxTime = chartData[chartData.length - 1].x;
        const ticks: number[] = [];
        const start = new Date(minTime);
        // Advance to the first day of the next month after the data start.
        const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
        while (d.getTime() < maxTime) {
            if (d.getUTCMonth() !== 0) { // skip Jan — the library marks year boundaries
                ticks.push(d.getTime());
            }
            d.setUTCMonth(d.getUTCMonth() + 1);
        }
        return ticks;
    }, [chartData]);

    // ── Render ────────────────────────────────────────────────────────────────

    const aggModes: { key: AggMode; label: string }[] = [
        { key: 'raw',  label: 'Raw'  },
        { key: 'mean', label: 'Mean' },
        { key: 'min',  label: 'Min'  },
        { key: 'max',  label: 'Max'  },
    ];

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
                    {/* Header */}
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

                    {/* Date range row */}
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
                                    fetchData(location.lat, location.lon, newStart, endDate, indexType, showTrendLine);
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
                                    fetchData(location.lat, location.lon, startDate, newEnd, indexType, showTrendLine);
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
                                    fetchData(location.lat, location.lon, fullStart, fullEnd, indexType, showTrendLine);
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
                            All
                        </button>
                        {location && (
                            <button
                                onClick={() =>
                                    fetchData(location.lat, location.lon, startDate, endDate, indexType, showTrendLine)
                                }
                                disabled={isLoading}
                                title="Refresh with new dates"
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

                    {/* Index selector: NDVI / EVI / NBR */}
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
                        {(['ndvi', 'evi', 'nbr'] as IndexType[]).map((idx) => {
                            const active = indexType === idx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setIndexType(idx)}
                                    style={{
                                        fontSize: 11,
                                        padding: '1px 10px',
                                        borderRadius: 10,
                                        border: active
                                            ? '1px solid #05CB63'
                                            : '1px solid var(--custom-light-blue-25)',
                                        background: active ? 'rgba(5,203,99,0.15)' : 'transparent',
                                        color: active ? '#05CB63' : 'var(--custom-light-blue-50)',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {idx.toUpperCase()}
                                </button>
                            );
                        })}
                    </div>

                    {/* Body */}
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

                                {!isLoading && !error && chartData.length > 0 && (
                                    <>
                                    {/* The library's VerticalReferenceLine groups sit above the
                                        PointerEventsOverlay and steal mouse events, preventing
                                        the data crosshair/tooltip from firing. Re-enable the
                                        pointer-events:none that the library has commented out. */}
                                    <style>{`.vertical-reference-line-group { pointer-events: none !important; }`}</style>
                                    <div
                                        style={{
                                            height: chartHeight,
                                            position: 'relative',
                                            cursor: 'crosshair',
                                            '--axis-tick-line-color': 'var(--custom-light-blue-50)',
                                            '--axis-tick-text-color': 'var(--custom-light-blue-50)',
                                            '--crosshair-reference-line-color': 'var(--custom-light-blue-50)',
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
                                            stroke="#05CB63"
                                            strokeWidth={1.5}
                                            margin={{ bottom: 30, left: 45, right: 15, top: 10 }}
                                            yScaleOptions={{ domain: yDomain }}
                                            xScaleOptions={{ useTimeScale: true }}
                                            bottomAxisOptions={{
                                                numberOfTicks: xTickCount,
                                                tickFormatFunction: (val: any) =>
                                                    formatInUTCTimeZone(
                                                        val,
                                                        showMonthLabels ? 'MMM yyyy' : 'yyyy'
                                                    ),
                                            }}
                                            verticalReferenceLines={verticalReferenceLines}
                                        />
                                        {/* Linear regression overlay — raw mode only, shown when toggled on and server returned data */}
                                        {aggMode === 'raw' && showTrendLine && linearRegression && chartData.length >= 2 && (() => {
                                            const mLeft = 45, mRight = 15, mTop = 10, mBottom = 30;
                                            // The chart container is inside `.px-3` (12px each side = 24px total),
                                            // so the available width for the chart is panelWidth - 24.
                                            const containerW = panelWidth - 24;
                                            const innerW = containerW - mLeft - mRight;
                                            const innerH = chartHeight - mTop - mBottom;
                                            const yToPixel = (v: number) =>
                                                mTop + innerH - ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerH;
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
                                                </svg>
                                            );
                                        })()}

                                        {/* Month minor ticks — small marks between the year ticks drawn by the library.
                                            Only rendered when year labels are active (showMonthLabels = false);
                                            when month text labels are shown, the library already provides fine ticks. */}
                                        {!showMonthLabels && monthTickPositions.length > 0 && (() => {
                                            const mLeft = 45, mRight = 15, mBottom = 30;
                                            const containerW = panelWidth - 24;
                                            const innerW = containerW - mLeft - mRight;
                                            const minTime = chartData[0].x;
                                            const maxTime = chartData[chartData.length - 1].x;
                                            const xToPixel = (t: number) =>
                                                mLeft + ((t - minTime) / (maxTime - minTime)) * innerW;
                                            const axisY = chartHeight - mBottom;
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
                                                    {monthTickPositions.map((t) => {
                                                        const px = xToPixel(t);
                                                        return (
                                                            <line
                                                                key={t}
                                                                x1={px} y1={axisY}
                                                                x2={px} y2={axisY + 3}
                                                                stroke="var(--custom-light-blue-50)"
                                                                strokeWidth={0.75}
                                                                opacity={0.5}
                                                            />
                                                        );
                                                    })}
                                                </svg>
                                            );
                                        })()}

                                        {/* Drag-to-select highlight rectangle */}
                                        {dragSel && Math.abs(dragSel.endPx - dragSel.startPx) > 2 && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    left: 45 + Math.min(dragSel.startPx, dragSel.endPx),
                                                    width: Math.abs(dragSel.endPx - dragSel.startPx),
                                                    top: 10,    // matches margin.top
                                                    bottom: 30, // matches margin.bottom
                                                    background: 'rgba(5, 203, 99, 0.15)',
                                                    border: '1px solid rgba(5, 203, 99, 0.5)',
                                                    borderRadius: 2,
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                        )}
                                    </div>
                                    </>
                                )}

                                {/* Aggregation mode toggles + observation count — below the chart */}
                                {!isLoading && !error && chartData.length > 0 && (
                                    <div className="flex items-center gap-2 pt-2">
                                        {aggModes.map(({ key, label }) => {
                                            const active = aggMode === key;
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => setAggMode(key)}
                                                    style={{
                                                        fontSize: 11,
                                                        padding: '1px 10px',
                                                        borderRadius: 10,
                                                        border: active
                                                            ? '1px solid #05CB63'
                                                            : '1px solid var(--custom-light-blue-25)',
                                                        background: active ? 'rgba(5,203,99,0.15)' : 'transparent',
                                                        color: active ? '#05CB63' : 'var(--custom-light-blue-50)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s',
                                                    }}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                        {aggMode === 'raw' && (
                                            <button
                                                onClick={() => {
                                                    const next = !showTrendLine;
                                                    setShowTrendLine(next);
                                                    // Only fetch when enabling AND we don't already have cached
                                                    // regression data for the current location/dates/index.
                                                    if (next && !linearRegression && location) {
                                                        fetchData(location.lat, location.lon, startDate, endDate, indexType, true);
                                                    }
                                                }}
                                                title={showTrendLine ? 'Hide trend line' : 'Show trend line'}
                                                style={{
                                                    fontSize: 11,
                                                    padding: '1px 10px',
                                                    borderRadius: 10,
                                                    border: showTrendLine
                                                        ? '1px solid #FFB347'
                                                        : '1px solid var(--custom-light-blue-25)',
                                                    background: showTrendLine ? 'rgba(255,179,71,0.15)' : 'transparent',
                                                    color: showTrendLine ? '#FFB347' : 'var(--custom-light-blue-50)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                Trend
                                            </button>
                                        )}
                                        {/* Equation — shown when trend is active and API returned slope/intercept */}
                                        {aggMode === 'raw' && showTrendLine && linearRegression?.slope !== undefined && (
                                            <span
                                                title="Linear regression equation (index per year)"
                                                style={{ fontSize: 11, color: '#FFB347', fontStyle: 'italic', whiteSpace: 'nowrap' }}
                                            >
                                                y&nbsp;=&nbsp;{linearRegression.slope.toFixed(3)}x&nbsp;{linearRegression.intercept! >= 0 ? '+' : '−'}&nbsp;{Math.abs(linearRegression.intercept!).toFixed(3)}
                                            </span>
                                        )}
                                        <span
                                            className="ml-auto"
                                            style={{ fontSize: 11, color: 'var(--custom-light-blue-50)' }}
                                        >
                                            {location.lat.toFixed(4)}°{location.lat >= 0 ? 'N' : 'S'},{' '}
                                            {location.lon.toFixed(4)}°{location.lon >= 0 ? 'E' : 'W'}
                                        </span>
                                        <span
                                            style={{ fontSize: 11, color: 'var(--custom-light-blue-50)' }}
                                            title="Total number of observations"
                                        >
                                            n&nbsp;=&nbsp;{ndviData.length}
                                        </span>
                                    </div>
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
                        {/* Visual grip dots */}
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
