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

import { NDVI_TIMESERIES_ENDPOINT } from './config';

export type IndexType = 'ndvi' | 'evi' | 'nbr';

export type NDVIDataPoint = {
    /** ISO date string, e.g. "2023-06-15" */
    date: string;
    /** Index value (NDVI, EVI, or NBR) */
    ndvi: number;
};

/**
 * Normalised linear regression endpoints for the time series.
 * y1 is the fitted value at the first data point; y2 at the last.
 * slope (per year) and intercept are included when the API returns coefficients.
 */
export type LinearRegression = {
    y1: number;
    y2: number;
    /** Trend slope in index-units per year (optional — only set when API returns slope/intercept). */
    slope?: number;
    /** Intercept (y-value at the first data point date). */
    intercept?: number;
};

export type NDVITimeSeriesResult = {
    data: NDVIDataPoint[];
    linearRegression?: LinearRegression;
};

/**
 * Fetch NDVI time series from the cloud function endpoint.
 * @param lat - Latitude of the point
 * @param lon - Longitude of the point
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 */
export const fetchNDVITimeSeries = async (
    lat: number,
    lon: number,
    startDate: string,
    endDate: string,
    index: IndexType = 'ndvi',
    includeLinearRegression = false
): Promise<NDVITimeSeriesResult> => {
    const response = await fetch(NDVI_TIMESERIES_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            latitude: parseFloat(lat.toFixed(6)),
            longitude: parseFloat(lon.toFixed(6)),
            start_date: startDate,
            end_date: endDate,
            index,
            ...(includeLinearRegression && { linear_regression: true }),
        }),
    });

    if (!response.ok) {
        let detail = '';
        try {
            detail = await response.text();
        } catch (_) {
            // ignore
        }
        throw new Error(
            `NDVI time series request failed: ${response.status} ${response.statusText}${detail ? ` — ${detail}` : ''}`
        );
    }

    const raw = await response.json();

    // Normalise to NDVIDataPoint[] regardless of response envelope
    const items: unknown[] = Array.isArray(raw) ? raw : raw?.timeseries ?? raw?.data ?? raw?.results ?? [];

    const data: NDVIDataPoint[] = items.map((item: any) => ({
        date: item.date ?? item.timestamp ?? item.time ?? '',
        ndvi: Number(item.index ?? item.ndvi ?? item.value ?? item.ndvi_value ?? 0),
    }));

    // Extract and normalise linear_regression if present.
    // Accepted API formats:
    //   [y_start, y_end]                     — two endpoint y-values
    //   { y1, y2 }                           — named endpoint y-values
    //   { slope, intercept }                 — coefficients where x = years since first data point
    let linearRegression: LinearRegression | undefined;
    const lr = !Array.isArray(raw) ? raw?.linear_regression : undefined;
    if (lr != null) {
        if (Array.isArray(lr) && lr.length >= 2) {
            linearRegression = { y1: Number(lr[0]), y2: Number(lr[1]) };
        } else if (typeof lr === 'object') {
            if ('y1' in lr && 'y2' in lr) {
                linearRegression = { y1: Number(lr.y1), y2: Number(lr.y2) };
            } else if ('slope' in lr && 'intercept' in lr) {
                // slope is per year; compute the time span in years between the
                // first and last data points so the line endpoints map correctly
                // onto the chart's x-axis (first data point → last data point).
                const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
                const firstMs = data.length > 0 ? new Date(data[0].date).getTime() : 0;
                const lastMs  = data.length > 0 ? new Date(data[data.length - 1].date).getTime() : 0;
                const yearsSpan = (lastMs - firstMs) / MS_PER_YEAR;
                linearRegression = {
                    y1: Number(lr.intercept),
                    y2: Number(lr.slope) * yearsSpan + Number(lr.intercept),
                    slope: Number(lr.slope),
                    intercept: Number(lr.intercept),
                };
            }
        }
    }

    return { data, linearRegression };
};

/**
 * Returns the default start date (2 years ago) as a YYYY-MM-DD string.
 */
export const getDefaultStartDate = (): string => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 2);
    return d.toISOString().split('T')[0];
};

/**
 * Returns yesterday's date as a YYYY-MM-DD string.
 * Using yesterday avoids 400 errors from APIs that reject future or same-day end dates
 * due to satellite data processing delays.
 */
export const getDefaultEndDate = (): string => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
};
