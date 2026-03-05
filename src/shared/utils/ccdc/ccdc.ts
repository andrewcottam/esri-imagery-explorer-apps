/**
 * Continuous Change Detection and Classification (CCDC)
 *
 * TypeScript port aligned with the Google Earth Engine CCDC implementation:
 *   https://developers.google.com/earth-engine/apidocs/ee-algorithms-temporalsegmentation-ccdc
 *
 * Derived from the pyccd reference implementation:
 *   https://github.com/repository-preservation/lcmap-pyccd
 *
 * Key GEE-alignment changes vs. the original pyccd defaults:
 *  - LASSO (L1-regularised coordinate descent) replaces OLS for model fitting,
 *    matching GEE's lambda=20 / maxIterations=10 000 defaults.
 *    For NDVI (0–1 scale) use SINGLE_BAND_PARAMS which scales lambda to 0.002.
 *  - MEOW_SIZE reduced from 12 to 6 (GEE minObservations=6).
 *  - DAY_DELTA increased from 365 to 486 (GEE minNumOfYearsScaler=1.33).
 *  - tmask / rlmFit remain OLS-based (not penalised in GEE either).
 *  - No QA-band processing — the caller is responsible for pre-filtering
 *    observations (removing clouds, shadows, fill pixels, etc.).
 *  - Works with any number of spectral bands, including a single-band
 *    convenience wrapper (e.g. for NDVI-only time series).
 */

// =============================================================================
// Types
// =============================================================================

export interface CCDCParams {
    /** Minimum number of observations needed to initialise a model window (12) */
    MEOW_SIZE: number;
    /** Number of observations to peek ahead/behind for change/outlier detection (6) */
    PEEK_SIZE: number;
    /** Minimum temporal span (days) required for model initialisation (365) */
    DAY_DELTA: number;
    /** Average days in a year used for harmonic frequency calculation (365.2425) */
    AVG_DAYS_YR: number;
    /** Minimum number of model coefficients – 1 intercept + 3 harmonic (4) */
    COEFFICIENT_MIN: number;
    /** Mid-level coefficients – 1 intercept + 5 harmonic (6) */
    COEFFICIENT_MID: number;
    /** Maximum coefficients – 1 intercept + 7 harmonic (8) */
    COEFFICIENT_MAX: number;
    /** Observation density multiplier: need at least numCoef × factor obs (3) */
    NUM_OBS_FACTOR: number;
    /** Normalised change-magnitude threshold = chi2.ppf(0.99, 5) (15.0863) */
    CHANGE_THRESHOLD: number;
    /** Normalised magnitude threshold for single-observation outliers (35.8882) */
    OUTLIER_THRESHOLD: number;
    /** Tmask threshold multiplier applied to the variogram (4.89) */
    T_CONST: number;
    /** Band indices used for change detection (pyccd default: [1,2,3,4,5]) */
    DETECTION_BANDS: number[];
    /** Band indices used for tmask outlier detection (pyccd default: [1,4]) */
    TMASK_BANDS: number[];
    /**
     * LASSO L1 regularisation penalty λ (0 = plain OLS).
     * GEE uses λ=20 for reflectance bands (0–10 000 scale).
     * For NDVI (0–1 scale) use λ≈0.002 (= 20 / 10 000).
     * Set to 0 to fall back to OLS.
     */
    LASSO_LAMBDA: number;
    /** Maximum coordinate-descent iterations for LASSO solver (GEE default: 10 000). */
    LASSO_MAX_ITER: number;
}

export interface FittedModel {
    /** Y-intercept (sklearn model.intercept_) */
    intercept: number;
    /** Feature coefficients [slope, cos1, sin1, …] (sklearn model.coef_) */
    coef: number[];
    /** Total coefficient count including intercept (4, 6 or 8) */
    numCoef: number;
    /** Root-mean-square error against observations used in fitting */
    rmse: number;
    /** Residuals (actual − predicted) for each observation in the fit window */
    residuals: number[];
}

export interface SpectralSegmentModel {
    intercept: number;
    coefficients: number[];
    rmse: number;
    magnitude: number;
}

export interface ChangeSegment {
    startDay: number;
    endDay: number;
    breakDay: number;
    numObservations: number;
    /** 1 if change was detected, 0 if segment ends at series boundary */
    changeProbability: number;
    /** num_coef used, or a special code: 14=START, 24=END, 44=INSUF, 54=SNOW */
    curveQA: number;
    /** One entry per input band */
    bands: SpectralSegmentModel[];
}

export interface CCDCResult {
    segments: ChangeSegment[];
    /** true = observation was used; false = masked out during processing */
    processingMask: boolean[];
}

// =============================================================================
// Default parameters
// =============================================================================

export const DEFAULT_PARAMS: CCDCParams = {
    // GEE-aligned: minObservations=6, minNumOfYearsScaler=1.33 → DAY_DELTA=486
    MEOW_SIZE: 6,
    PEEK_SIZE: 6,
    DAY_DELTA: 486,   // 1.33 × 365.2425 ≈ 486
    AVG_DAYS_YR: 365.2425,
    COEFFICIENT_MIN: 4,
    COEFFICIENT_MID: 6,
    COEFFICIENT_MAX: 8,
    NUM_OBS_FACTOR: 3,
    CHANGE_THRESHOLD: 15.086272469388987,
    OUTLIER_THRESHOLD: 35.888186879610423,
    T_CONST: 4.89,
    DETECTION_BANDS: [1, 2, 3, 4, 5],
    TMASK_BANDS: [1, 4],
    LASSO_LAMBDA: 20,       // GEE default; calibrated for reflectance scale (0–10 000)
    LASSO_MAX_ITER: 10000,  // GEE default
};

/**
 * Params preset for single-band (e.g. NDVI) time series.
 * LASSO_LAMBDA is scaled from the GEE reflectance value (λ=20, scale 0–10 000)
 * to NDVI scale (0–1): λ = 20 / 10 000 = 0.002.
 */
export const SINGLE_BAND_PARAMS: CCDCParams = {
    ...DEFAULT_PARAMS,
    DETECTION_BANDS: [0],
    TMASK_BANDS: [0],
    LASSO_LAMBDA: 0.002,  // 20 / 10 000 — scaled for NDVI range
};

// CURVE_QA codes
const CQA_START = 14;
const CQA_END = 24;

// =============================================================================
// Math utilities
// =============================================================================

function median(arr: number[]): number {
    if (arr.length === 0) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length & 1 ? s[m] : (s[m - 1] + s[m]) * 0.5;
}

function sumOfSquares(v: number[]): number {
    return v.reduce((acc, x) => acc + x * x, 0);
}

function euclideanNorm(v: number[]): number {
    return Math.sqrt(sumOfSquares(v));
}

function calcRmse(
    actual: number[],
    predicted: number[],
    numParams: number,
): { rmse: number; residuals: number[] } {
    const residuals = actual.map((a, i) => a - predicted[i]);
    const denom = residuals.length - numParams;
    const rmse =
        denom > 0 ? Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / denom) : 0;
    return { rmse, residuals };
}

function stdDev(arr: number[]): number {
    const m = arr.reduce((s, x) => s + x, 0) / arr.length;
    return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length);
}

// =============================================================================
// Small matrix operations (for OLS solver on p×p matrices, p ≤ 8)
// =============================================================================

function matTranspose(A: number[][]): number[][] {
    return A[0].map((_, j) => A.map((row) => row[j]));
}

function matVecMul(A: number[][], b: number[]): number[] {
    return A.map((row) => row.reduce((s, aij, j) => s + aij * b[j], 0));
}

/** Solve A·x = b via Gaussian elimination with partial pivoting (A is n×n). */
function gaussianElim(A: number[][], b: number[]): number[] {
    const n = A.length;
    const M = A.map((row, i) => [...row, b[i]]);

    for (let col = 0; col < n; col++) {
        // Partial pivot
        let maxRow = col;
        for (let row = col + 1; row < n; row++) {
            if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
        }
        [M[col], M[maxRow]] = [M[maxRow], M[col]];

        if (Math.abs(M[col][col]) < 1e-14) continue;

        for (let row = col + 1; row < n; row++) {
            const f = M[row][col] / M[col][col];
            for (let j = col; j <= n; j++) M[row][j] -= f * M[col][j];
        }
    }

    const x = new Array<number>(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        x[i] = M[i][n];
        for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
        if (Math.abs(M[i][i]) > 1e-14) x[i] /= M[i][i];
    }
    return x;
}

/**
 * OLS: solve β = (XᵀX)⁻¹ Xᵀy.
 * X is an array of rows (n × p), y is length-n.
 * Returns coefficients of length p.
 */
function solveOLS(X: number[][], y: number[]): number[] {
    const Xt = matTranspose(X);
    // XᵀX  (p × p)
    const p = Xt.length;
    const XtX: number[][] = Array.from({ length: p }, (_, i) =>
        Array.from({ length: p }, (_, j) =>
            Xt[i].reduce((s, xi, k) => s + xi * Xt[j][k], 0),
        ),
    );
    // Tiny ridge for numerical stability
    for (let i = 0; i < p; i++) XtX[i][i] += 1e-10;
    // Xᵀy  (p)
    const Xty = matVecMul(Xt, y);
    return gaussianElim(XtX, Xty);
}

/**
 * LASSO: L1-regularised regression via coordinate descent.
 *
 * Objective: (1/2n) ‖y − Xβ‖² + λ · Σ_{j>0} |β_j|
 *
 * The intercept (column j=0) is NOT penalised, matching GEE behaviour.
 *
 * Soft-threshold update for j > 0:
 *   ρ   = Σ_i X[i,j] · (r[i] + X[i,j] · β_j_old)   (partial residual correlation)
 *   β_j = sign(ρ) · max(|ρ| − n·λ, 0) / ‖X[:,j]‖²
 *
 * X is (n × p), y is length-n.  Returns coefficients of length p.
 */
function solveLASSO(X: number[][], y: number[], lambda: number, maxIter: number): number[] {
    const n = X.length;
    const p = X[0].length;

    // Pre-compute column squared norms ‖X[:,j]‖²
    const xNormSq = new Array<number>(p).fill(0);
    for (let j = 0; j < p; j++)
        for (let i = 0; i < n; i++) xNormSq[j] += X[i][j] * X[i][j];

    const beta = new Array<number>(p).fill(0);
    // Running residuals r = y − Xβ  (β=0 initially, so r=y)
    const r = [...y];
    const tol = 1e-8;

    for (let iter = 0; iter < maxIter; iter++) {
        let maxDelta = 0;
        for (let j = 0; j < p; j++) {
            if (xNormSq[j] < 1e-14) continue;
            const betaOld = beta[j];

            // Partial residual correlation ρ = X[:,j]·(r + X[:,j]·β_j)
            let rho = 0;
            for (let i = 0; i < n; i++) rho += X[i][j] * (r[i] + X[i][j] * betaOld);

            if (j === 0) {
                // Intercept: no L1 penalty
                beta[j] = rho / xNormSq[j];
            } else {
                // Soft-threshold
                beta[j] = Math.sign(rho) * Math.max(Math.abs(rho) - n * lambda, 0) / xNormSq[j];
            }

            const delta = beta[j] - betaOld;
            if (delta !== 0) {
                for (let i = 0; i < n; i++) r[i] -= X[i][j] * delta;
                if (Math.abs(delta) > maxDelta) maxDelta = Math.abs(delta);
            }
        }
        if (maxDelta < tol) break;
    }
    return beta;
}

// =============================================================================
// Variogram
// =============================================================================

/** First-order madogram: median of |diff| for each band. obs is (nBands × n). */
function calculateVariogram(obs: number[][]): number[] {
    return obs.map((band) => {
        const diffs: number[] = [];
        for (let i = 1; i < band.length; i++) diffs.push(Math.abs(band[i] - band[i - 1]));
        return median(diffs);
    });
}

/**
 * Adjusted variogram: uses pairs of observations that are > 30 days apart
 * (first lag where the majority of intervals exceeds 30 days).
 * obs is (nBands × n).
 */
function adjustedVariogram(dates: number[], obs: number[][]): number[] {
    let vario = calculateVariogram(obs);

    for (let lag = 0; lag < dates.length - 1; lag++) {
        const intervals: number[] = [];
        for (let i = 0; i < dates.length - lag - 1; i++) {
            intervals.push(dates[i + lag + 1] - dates[i]);
        }
        if (intervals.length === 0) break;

        const maj = median(intervals); // pyccd uses mode; median equivalent for regular revisit
        if (maj > 30) {
            vario = obs.map((band) => {
                const vals: number[] = [];
                for (let i = 0; i < dates.length - lag - 1; i++) {
                    if (intervals[i] > 30) vals.push(Math.abs(band[i + lag + 1] - band[i]));
                }
                return vals.length > 0 ? median(vals) : vario[obs.indexOf(band)];
            });
            break;
        }
    }
    return vario;
}

// =============================================================================
// Robust fitting (IRLS with Tukey bisquare) — used for tmask
// =============================================================================

/** Tukey bisquare weights: (1−(r/c)²)² for |r| < c, else 0. */
function bisquare(resid: number[], c = 4.685): number[] {
    return resid.map((r) => (Math.abs(r) < c ? (1 - (r / c) ** 2) ** 2 : 0));
}

/**
 * Median-Absolute-Deviation robust scale estimate.
 * Skips the first 4 sorted absolute residuals (pyccd implementation detail).
 */
function mad(x: number[], c = 0.6745): number {
    const sorted = x.map(Math.abs).sort((a, b) => a - b);
    return median(sorted.slice(4)) / c;
}

/** Weighted OLS: solve (XᵀWX)β = XᵀWy. */
function weightedOLS(
    X: number[][],
    y: number[],
    w: number[],
): { beta: number[]; resid: number[] } {
    const sw = w.map(Math.sqrt);
    const Xw = X.map((row, i) => row.map((xi) => xi * sw[i]));
    const yw = y.map((yi, i) => yi * sw[i]);
    const beta = solveOLS(Xw, yw);
    const resid = y.map((yi, i) => yi - X[i].reduce((s, xi, j) => s + xi * beta[j], 0));
    return { beta, resid };
}

/**
 * Iteratively Reweighted Least Squares (IRLS) with bisquare weights.
 * Returns { coef, predict }.
 */
function rlmFit(
    X: number[][],
    y: number[],
    maxIter = 50,
    tol = 1e-8,
): { coef: number[]; predict: (Xp: number[][]) => number[] } {
    const n = X.length;
    let { beta, resid } = weightedOLS(X, y, new Array<number>(n).fill(1));

    let scale = mad(resid);
    const EPS = Number.EPSILON;

    if (scale < EPS) {
        return {
            coef: beta,
            predict: (Xp) => Xp.map((row) => row.reduce((s, xi, j) => s + xi * beta[j], 0)),
        };
    }

    let converged = false;
    for (let iter = 0; iter < maxIter && !converged; iter++) {
        const prevBeta = [...beta];
        scale = Math.max(EPS * stdDev(y), mad(resid));
        const weights = bisquare(resid.map((r) => r / scale));
        ({ beta, resid } = weightedOLS(X, y, weights));
        converged = beta.every((b, i) => Math.abs(b - prevBeta[i]) <= tol);
    }

    return {
        coef: beta,
        predict: (Xp) => Xp.map((row) => row.reduce((s, xi, j) => s + xi * beta[j], 0)),
    };
}

// =============================================================================
// Tmask — temporal outlier detection during initialisation
// =============================================================================

/**
 * Build 5-column design matrix for tmask:
 *   [cos(ωt), sin(ωt), cos(obs_cycle·t), sin(obs_cycle·t), 1]
 * where obs_cycle = ω / ceil(span / avgDaysYr).
 */
function tmaskMatrix(dates: number[], avgDaysYr: number): number[][] {
    const omega = (2 * Math.PI) / avgDaysYr;
    const span = dates[dates.length - 1] - dates[0];
    const numYrs = Math.max(1, Math.ceil(span / avgDaysYr));
    const obsCycle = omega / numYrs;

    return dates.map((t) => [
        Math.cos(omega * t),
        Math.sin(omega * t),
        Math.cos(obsCycle * t),
        Math.sin(obsCycle * t),
        1.0,
    ]);
}

/**
 * Flag observations as outliers using robust regression on each tmask band.
 * An observation is an outlier in a band when |predicted − observed| > variogram[band] × tConst.
 * obs is (nBands × n). Returns boolean array (true = outlier).
 */
function tmask(
    dates: number[],
    obs: number[][],
    variogram: number[],
    bands: number[],
    tConst: number,
    avgDaysYr: number,
): boolean[] {
    const n = dates.length;
    const outliers = new Array<boolean>(n).fill(false);
    const X = tmaskMatrix(dates, avgDaysYr);

    for (const bi of bands) {
        const y = obs[bi];
        const fit = rlmFit(X, y);
        const predicted = fit.predict(X);
        const threshold = variogram[bi] * tConst;
        for (let i = 0; i < n; i++) {
            if (Math.abs(predicted[i] - y[i]) > threshold) outliers[i] = true;
        }
    }
    return outliers;
}

// =============================================================================
// Harmonic (Fourier) model
// =============================================================================

/**
 * Build design matrix including intercept column.  Shape: (n × numCoef).
 * Columns: [1, t, cos(ωt), sin(ωt), cos(2ωt), sin(2ωt), cos(3ωt), sin(3ωt)]
 */
function buildDesignMatrix(dates: number[], numCoef: number, avgDaysYr: number): number[][] {
    const omega = (2 * Math.PI) / avgDaysYr;
    return dates.map((t) => {
        const wt = omega * t;
        const row = [1.0, t, Math.cos(wt), Math.sin(wt)];
        if (numCoef >= 6) row.push(Math.cos(2 * wt), Math.sin(2 * wt));
        if (numCoef >= 8) row.push(Math.cos(3 * wt), Math.sin(3 * wt));
        return row;
    });
}

/**
 * Fit a harmonic model and return a FittedModel.
 * Uses LASSO coordinate descent when lassoLambda > 0, otherwise plain OLS.
 */
function fitModel(
    dates: number[],
    y: number[],
    numCoef: number,
    avgDaysYr: number,
    lassoLambda = 0,
    lassoMaxIter = 10000,
): FittedModel {
    if (dates.length === 0) {
        return { intercept: 0, coef: new Array(numCoef - 1).fill(0), numCoef, rmse: 0, residuals: [] };
    }
    const X = buildDesignMatrix(dates, numCoef, avgDaysYr);
    const beta = lassoLambda > 0
        ? solveLASSO(X, y, lassoLambda, lassoMaxIter)
        : solveOLS(X, y);
    const predicted = X.map((row) => row.reduce((s, xi, j) => s + xi * beta[j], 0));
    const { rmse, residuals } = calcRmse(y, predicted, numCoef);
    return {
        intercept: beta[0],
        coef: beta.slice(1), // [slope, cos1, sin1, ...]
        numCoef,
        rmse,
        residuals,
    };
}

/** Predict from a FittedModel at the given dates. */
function modelPredict(model: FittedModel, dates: number[], avgDaysYr: number): number[] {
    if (dates.length === 0) return [];
    const X = buildDesignMatrix(dates, model.numCoef, avgDaysYr);
    const beta = [model.intercept, ...model.coef];
    return X.map((row) => row.reduce((s, xi, j) => s + xi * beta[j], 0));
}

// =============================================================================
// Change-detection helpers
// =============================================================================

/** Number of coefficients is determined by observation density (dates.length / numObsFactor). */
function determineNumCoefs(
    dates: number[],
    coefMin: number,
    coefMid: number,
    coefMax: number,
    numObsFactor: number,
): number {
    const span = dates.length / numObsFactor;
    if (span < coefMid) return coefMin;
    if (span < coefMax) return coefMid;
    return coefMax;
}

// --- chi-squared PPF (needed to adjust change threshold for dense revisit sensors) ---

function normalQuantile(p: number): number {
    // Acklam's rational approximation — accurate to ~1.15e-9
    const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
                1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
    const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
                6.680131188771972e1, -1.328068155288572e1];
    const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
               -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
    const pLow = 0.02425;
    if (p < pLow) {
        const q = Math.sqrt(-2 * Math.log(p));
        return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
               ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    if (p <= 1 - pLow) {
        const q = p - 0.5, r = q * q;
        return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
               (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    }
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
             ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

/** Wilson-Hilferty chi-squared PPF approximation. */
function chi2ppf(p: number, df: number): number {
    const z = normalQuantile(p);
    const h = 2 / (9 * df);
    return df * Math.pow(1 - h + z * Math.sqrt(h), 3);
}

/**
 * Scale peek size for the sensor's revisit interval.
 * pyccd calibrated for 16-day Landsat repeat; Sentinel-2 revisit ≈ 5 days
 * would give a larger peek size (more observations per window).
 */
function adjustPeek(dates: number[], defPeek: number): number {
    if (dates.length < 2) return defPeek;
    const diffs: number[] = [];
    for (let i = 1; i < dates.length; i++) diffs.push(dates[i] - dates[i - 1]);
    const delta = median(diffs);
    if (delta <= 0) return defPeek;
    const adj = Math.round(defPeek * 16 / delta);
    return Math.max(adj, defPeek);
}

/** Adjust change threshold when peek window is larger than the default. */
function adjustChgThresh(peek: number, defPeek: number, defThresh: number): number {
    if (peek <= defPeek) return defThresh;
    const ptCg = 1 - Math.pow(1 - 0.99, defPeek / peek);
    return chi2ppf(ptCg, 5);
}

/**
 * Check model stability: the Euclidean norm of per-band check values must be
 * below the change threshold.
 * check_val = (|slope × span| + |first_residual| + |last_residual|) / max(variogram, rmse)
 */
function stable(
    models: FittedModel[],
    dates: number[],
    variogram: number[],
    tCg: number,
    detectionBands: number[],
): boolean {
    const span = dates[dates.length - 1] - dates[0];
    const checkVals = detectionBands.map((bi) => {
        const m = models[bi];
        const rmseNorm = Math.max(variogram[bi], m.rmse);
        // m.coef[0] = slope coefficient (first feature after intercept)
        const slope = m.coef[0] * span;
        return (Math.abs(slope) + Math.abs(m.residuals[0]) + Math.abs(m.residuals[m.residuals.length - 1])) / rmseNorm;
    });
    return sumOfSquares(checkVals) < tCg;
}

/**
 * Absolute residuals between observations and model predictions.
 * Returns an array of length dates.length.
 */
function calcResiduals(
    dates: number[],
    obs: number[],
    model: FittedModel,
    avgDaysYr: number,
): number[] {
    const pred = modelPredict(model, dates, avgDaysYr);
    return pred.map((p, i) => Math.abs(obs[i] - p));
}

/**
 * Change magnitude per time step across detection bands.
 * residuals: (nDetBands × peekSize)
 * Returns: (peekSize,) — squared normalised sum across bands.
 */
function changeMagnitude(
    residuals: number[][],
    variogram: number[],
    compRmse: number[],
): number[] {
    const nObs = residuals[0].length;
    const rmse = residuals.map((_, i) => Math.max(variogram[i], compRmse[i]));
    const magnitudes = new Array<number>(nObs).fill(0);
    for (let t = 0; t < nObs; t++) {
        for (let b = 0; b < residuals.length; b++) {
            magnitudes[t] += (residuals[b][t] / rmse[b]) ** 2;
        }
    }
    return magnitudes;
}

/** Change is detected when EVERY observation in the peek window exceeds the threshold. */
function detectChange(magnitudes: number[], threshold: number): boolean {
    return magnitudes.every((m) => m > threshold);
}

/** An observation is an outlier when its magnitude exceeds the outlier threshold. */
function detectOutlier(magnitude: number, threshold: number): boolean {
    return magnitude > threshold;
}

/**
 * Find the indices (within windowSlice of allDates) of the `num` observations
 * whose day-of-year is most similar to allDates[targetIdx].
 */
function findClosestDoy(
    allDates: number[],
    targetIdx: number,
    winStart: number,
    winEnd: number,
    num: number,
): number[] {
    const target = allDates[targetIdx];
    const scored = allDates.slice(winStart, winEnd).map((d, i) => {
        const drt = d - target;
        const dyr = Math.abs(Math.round(drt / 365.25) * 365.25 - drt);
        return { i, dyr };
    });
    scored.sort((a, b) => a.dyr - b.dyr);
    return scored.slice(0, num).map((s) => s.i);
}

// =============================================================================
// Processing-mask helpers
// =============================================================================

function applyMask(arr: number[], mask: boolean[]): number[] {
    return arr.filter((_, i) => mask[i]);
}

function applyMask2d(arr: number[][], mask: boolean[]): number[][] {
    return arr.map((band) => band.filter((_, i) => mask[i]));
}

/**
 * Set specific indices (into the active/unmasked subset) to false.
 * subIndices are positions within the currently-active observations.
 */
function updateMask(mask: boolean[], subIndices: number | number[]): boolean[] {
    const newMask = [...mask];
    const active: number[] = [];
    for (let i = 0; i < mask.length; i++) if (mask[i]) active.push(i);
    const idxArr = Array.isArray(subIndices) ? subIndices : [subIndices];
    for (const si of idxArr) {
        if (si >= 0 && si < active.length) newMask[active[si]] = false;
    }
    return newMask;
}

/** Mask out observations that are flagged by tmask within a given sub-window. */
function updateMaskByTmask(mask: boolean[], outliers: boolean[], winStart: number): boolean[] {
    const newMask = [...mask];
    const active: number[] = [];
    for (let i = 0; i < mask.length; i++) if (mask[i]) active.push(i);
    for (let i = 0; i < outliers.length; i++) {
        if (outliers[i]) newMask[active[winStart + i]] = false;
    }
    return newMask;
}

// =============================================================================
// Segment construction
// =============================================================================

function buildSegment(
    models: FittedModel[],
    startDay: number,
    endDay: number,
    breakDay: number,
    magnitudes: number[],
    numObservations: number,
    changeProbability: number,
    curveQA: number,
): ChangeSegment {
    return {
        startDay,
        endDay,
        breakDay,
        numObservations,
        changeProbability,
        curveQA,
        bands: models.map((m, i) => ({
            intercept: m.intercept,
            coefficients: [...m.coef],
            rmse: m.rmse,
            magnitude: magnitudes[i] ?? 0,
        })),
    };
}

// =============================================================================
// Initialize
// =============================================================================

interface InitResult {
    wStart: number;
    wStop: number;
    models: FittedModel[] | null;
    mask: boolean[];
}

/**
 * Find a stable starting window for the change-detection process.
 * Increments the window until we have ≥ 1 year of clear data and a stable model.
 */
function initialize(
    dates: number[],
    obs: number[][],
    mask: boolean[],
    wStart: number,
    wStop: number,
    variogram: number[],
    params: CCDCParams,
): InitResult {
    const { MEOW_SIZE, DAY_DELTA, CHANGE_THRESHOLD, T_CONST, AVG_DAYS_YR,
            TMASK_BANDS, DETECTION_BANDS, COEFFICIENT_MIN,
            LASSO_LAMBDA, LASSO_MAX_ITER } = params;

    let ws = wStart, we = wStop;
    let currentMask = mask;
    let models: FittedModel[] | null = null;

    for (let safeIter = 0; safeIter < 5000; safeIter++) {
        const period = applyMask(dates, currentMask);
        const spectral = applyMask2d(obs, currentMask);

        if (we + MEOW_SIZE >= period.length) break;

        const winDates = period.slice(ws, we);
        if (winDates.length < 2 || winDates[winDates.length - 1] - winDates[0] < DAY_DELTA) {
            we++;
            continue;
        }

        // Run tmask on current window
        const winObs = spectral.map((band) => band.slice(ws, we));
        const outliers = tmask(winDates, winObs, variogram, TMASK_BANDS, T_CONST, AVG_DAYS_YR);
        const nOutliers = outliers.filter(Boolean).length;

        if (nOutliers === we - ws) { we++; continue; }

        if (nOutliers > 0) {
            currentMask = updateMaskByTmask(currentMask, outliers, ws);
            we -= nOutliers;
        }

        const updPeriod = applyMask(dates, currentMask);
        const updWin = updPeriod.slice(ws, we);
        if (updWin.length < MEOW_SIZE || updWin[updWin.length - 1] - updWin[0] < DAY_DELTA) {
            we++;
            continue;
        }

        const updSpectral = applyMask2d(obs, currentMask);
        const fitDates = updPeriod.slice(ws, we);
        models = obs.map((_, bi) =>
            fitModel(fitDates, updSpectral[bi].slice(ws, we), COEFFICIENT_MIN, AVG_DAYS_YR, LASSO_LAMBDA, LASSO_MAX_ITER),
        );

        if (!stable(models, fitDates, variogram, CHANGE_THRESHOLD, DETECTION_BANDS)) {
            ws++;
            we++;
            models = null;
            continue;
        }

        break;
    }

    return { wStart: ws, wStop: we, models, mask: currentMask };
}

// =============================================================================
// Lookback
// =============================================================================

interface LookResult {
    wStart: number;
    wStop: number;
    mask: boolean[];
}

/**
 * After initialisation, try to include earlier observations into the model
 * by checking whether they fit within the model's residual envelope.
 */
function lookback(
    dates: number[],
    obs: number[][],
    wStart: number,
    wStop: number,
    models: FittedModel[],
    previousEnd: number,
    mask: boolean[],
    variogram: number[],
    params: CCDCParams,
): LookResult {
    const { PEEK_SIZE, CHANGE_THRESHOLD, OUTLIER_THRESHOLD, AVG_DAYS_YR, DETECTION_BANDS } = params;
    let ws = wStart, we = wStop;
    let currentMask = mask;

    while (ws > previousEnd) {
        const period = applyMask(dates, currentMask);
        const spectral = applyMask2d(obs, currentMask);

        // Peek window: up to PEEK_SIZE observations before ws
        const peekEnd = ws;
        const peekStart = Math.max(previousEnd, ws - PEEK_SIZE);
        if (peekStart >= peekEnd) break;

        const peekDates = period.slice(peekStart, peekEnd);
        const residuals = obs.map((_, bi) =>
            calcResiduals(peekDates, spectral[bi].slice(peekStart, peekEnd), models[bi], AVG_DAYS_YR),
        );

        const detResiduals = DETECTION_BANDS.map((bi) => residuals[bi]);
        const detVariogram = DETECTION_BANDS.map((bi) => variogram[bi]);
        const compRmse = DETECTION_BANDS.map((bi) => models[bi].rmse);
        const magnitudes = changeMagnitude(detResiduals, detVariogram, compRmse);

        if (detectChange(magnitudes, CHANGE_THRESHOLD)) break;

        // The immediate observation before ws is magnitudes[magnitudes.length-1]
        const immediateMag = magnitudes[magnitudes.length - 1];
        if (detectOutlier(immediateMag, OUTLIER_THRESHOLD)) {
            currentMask = updateMask(currentMask, ws - 1);
            ws = Math.max(0, ws - 1);
            we = Math.max(0, we - 1);
            continue;
        }

        // Include observation
        ws = peekStart;
    }

    return { wStart: ws, wStop: we, mask: currentMask };
}

// =============================================================================
// Lookforward
// =============================================================================

interface LookforwardResult {
    segment: ChangeSegment;
    mask: boolean[];
    wStart: number;
    wStop: number;
}

/**
 * Extend the model window one observation at a time, checking each new peek
 * window for change.  Returns as soon as change is detected or data runs out.
 */
function lookforward(
    dates: number[],
    obs: number[][],
    wStart: number,
    wStop: number,
    mask: boolean[],
    variogram: number[],
    params: CCDCParams,
): LookforwardResult {
    const { PEEK_SIZE, COEFFICIENT_MIN, COEFFICIENT_MID, COEFFICIENT_MAX,
            NUM_OBS_FACTOR, DETECTION_BANDS, CHANGE_THRESHOLD, OUTLIER_THRESHOLD,
            AVG_DAYS_YR, LASSO_LAMBDA, LASSO_MAX_ITER } = params;

    let ws = wStart, we = wStop;
    let currentMask = mask;
    let models: FittedModel[] | null = null;
    let fitStart = ws, fitStop = we;
    let fitSpan = -1;
    let numCoefs = COEFFICIENT_MIN;
    let change = 0;
    let peekStart = we, peekEnd = we + PEEK_SIZE; // for segment result

    for (let safeIter = 0; safeIter < 10000; safeIter++) {
        const period = applyMask(dates, currentMask);
        const spectral = applyMask2d(obs, currentMask);

        if (we + PEEK_SIZE > period.length) break;

        numCoefs = determineNumCoefs(
            period.slice(ws, we), COEFFICIENT_MIN, COEFFICIENT_MID, COEFFICIENT_MAX, NUM_OBS_FACTOR,
        );
        peekStart = we;
        peekEnd = we + PEEK_SIZE;

        const modelSpan = period[we - 1] - period[ws];
        const needsRefit =
            !models || we - ws < 24 || modelSpan >= 1.33 * fitSpan;

        if (needsRefit) {
            fitStart = ws;
            fitStop = we;
            fitSpan = period[we - 1] - period[ws];
            models = obs.map((_, bi) =>
                fitModel(
                    period.slice(fitStart, fitStop),
                    spectral[bi].slice(fitStart, fitStop),
                    numCoefs,
                    AVG_DAYS_YR,
                    LASSO_LAMBDA,
                    LASSO_MAX_ITER,
                ),
            );
        }

        const peekDates = period.slice(peekStart, peekEnd);
        const residuals = obs.map((_, bi) =>
            calcResiduals(peekDates, spectral[bi].slice(peekStart, peekEnd), models![bi], AVG_DAYS_YR),
        );

        // Comparison RMSE
        let compRmse: number[];
        if (we - ws <= 24) {
            compRmse = DETECTION_BANDS.map((bi) => models![bi].rmse);
        } else {
            const closest = findClosestDoy(period, peekEnd - 1, fitStart, fitStop, 24);
            compRmse = DETECTION_BANDS.map((bi) => {
                const closeRes = closest.map((ci) => models![bi].residuals[ci] ?? 0);
                return euclideanNorm(closeRes) / 4;
            });
        }

        const detResiduals = DETECTION_BANDS.map((bi) => residuals[bi]);
        const detVariogram = DETECTION_BANDS.map((bi) => variogram[bi]);
        const magnitudes = changeMagnitude(detResiduals, detVariogram, compRmse);

        if (detectChange(magnitudes, CHANGE_THRESHOLD)) {
            change = 1;
            break;
        }

        if (detectOutlier(magnitudes[0], OUTLIER_THRESHOLD)) {
            currentMask = updateMask(currentMask, peekStart);
            continue; // period and spectral recomputed at top of loop
        }

        if (we + PEEK_SIZE > period.length) break;
        we++;
    }

    // Median residuals across the peek window for magnitude reporting
    const period = applyMask(dates, currentMask);
    const spectral = applyMask2d(obs, currentMask);
    const safePeekEnd = Math.min(peekEnd, period.length);
    const reportResiduals = models
        ? obs.map((_, bi) =>
              calcResiduals(
                  period.slice(peekStart, safePeekEnd),
                  spectral[bi].slice(peekStart, safePeekEnd),
                  models![bi],
                  AVG_DAYS_YR,
              ),
          )
        : obs.map(() => [0]);
    const magnitudes = reportResiduals.map((r) => median(r));

    const fallbackModel = (bi: number) =>
        fitModel(period.slice(ws, we), spectral[bi].slice(ws, we), numCoefs, AVG_DAYS_YR, LASSO_LAMBDA, LASSO_MAX_ITER);

    const segment = buildSegment(
        models ?? obs.map((_, bi) => fallbackModel(bi)),
        period[ws],
        period[we - 1],
        period[peekStart] ?? period[we - 1],
        magnitudes,
        we - ws,
        change,
        numCoefs,
    );

    return { segment, mask: currentMask, wStart: ws, wStop: we };
}

// =============================================================================
// Catch — fit a general model to a gap/boundary segment
// =============================================================================

function catchSegment(
    dates: number[],
    obs: number[][],
    mask: boolean[],
    winStart: number,
    winEnd: number,
    curveQA: number,
    params: CCDCParams,
): ChangeSegment {
    const { AVG_DAYS_YR, COEFFICIENT_MIN, LASSO_LAMBDA, LASSO_MAX_ITER } = params;
    const period = applyMask(dates, mask);
    const spectral = applyMask2d(obs, mask);

    const segDates = period.slice(winStart, winEnd);
    const models = obs.map((_, bi) =>
        fitModel(segDates, spectral[bi].slice(winStart, winEnd), COEFFICIENT_MIN, AVG_DAYS_YR, LASSO_LAMBDA, LASSO_MAX_ITER),
    );

    const breakDay =
        winEnd < period.length ? period[winEnd] : period[period.length - 1];

    return buildSegment(
        models,
        period[winStart],
        period[winEnd - 1],
        breakDay,
        new Array<number>(obs.length).fill(0),
        winEnd - winStart,
        0,
        curveQA,
    );
}

// =============================================================================
// Standard procedure — the core change-detection loop
// =============================================================================

function standardProcedure(dates: number[], obs: number[][], params: CCDCParams): CCDCResult {
    const { MEOW_SIZE, PEEK_SIZE } = params;
    const n = dates.length;
    let mask = new Array<boolean>(n).fill(true);
    const results: ChangeSegment[] = [];

    const variogram = adjustedVariogram(dates, obs);
    const peekSize = adjustPeek(dates, PEEK_SIZE);
    const changeThresh = adjustChgThresh(peekSize, PEEK_SIZE, params.CHANGE_THRESHOLD);
    const p: CCDCParams = { ...params, PEEK_SIZE: peekSize, CHANGE_THRESHOLD: changeThresh };

    let ws = 0, we = MEOW_SIZE;
    let previousEnd = 0;
    let start = true;

    for (let seg = 0; seg < 1000; seg++) {
        const period = applyMask(dates, mask);
        if (we > period.length - MEOW_SIZE) break;

        if (results.length > 0) start = false;

        // Step 1: Initialize
        const init = initialize(dates, obs, mask, ws, we, variogram, p);
        mask = init.mask;
        ws = init.wStart;
        we = init.wStop;
        if (!init.models) break;

        // Step 2: Lookback
        if (ws > previousEnd) {
            const lb = lookback(dates, obs, ws, we, init.models, previousEnd, mask, variogram, p);
            mask = lb.mask;
            ws = lb.wStart;
            we = lb.wStop;
        }

        // Step 3: Catch — gap between previous break and current start
        if (ws - previousEnd > peekSize && start) {
            results.push(catchSegment(dates, obs, mask, previousEnd, ws, CQA_START, p));
            start = false;
        }

        // Check if enough data remains for lookforward
        const period3 = applyMask(dates, mask);
        if (we + peekSize > period3.length) break;

        // Step 4: Lookforward
        const lf = lookforward(dates, obs, ws, we, mask, variogram, p);
        mask = lf.mask;
        ws = lf.wStart;
        we = lf.wStop;
        results.push(lf.segment);

        // Step 5: Iterate
        previousEnd = we;
        ws = we;
        we = we + MEOW_SIZE;
    }

    // Step 6: Catch — end of series
    const finalPeriod = applyMask(dates, mask);
    if (previousEnd + peekSize < finalPeriod.length) {
        results.push(catchSegment(dates, obs, mask, previousEnd, finalPeriod.length, CQA_END, p));
    }

    return { segments: results, processingMask: mask };
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Run CCDC on a single pixel's multi-band time series.
 *
 * @param dates  Ordinal day numbers (sorted ascending, length N).
 *               Use `dateToOrdinal()` to convert JavaScript Date objects.
 * @param obs    2-D array [numBands][N] of spectral values (any units).
 * @param params Optional parameter overrides. See CCDCParams and DEFAULT_PARAMS.
 * @returns      Detected change segments and per-observation processing mask.
 */
export function detect(
    dates: number[],
    obs: number[][],
    params: Partial<CCDCParams> = {},
): CCDCResult {
    if (dates.length < 2 || obs.length === 0) {
        return { segments: [], processingMask: new Array(dates.length).fill(true) };
    }

    const nBands = obs.length;
    const p: CCDCParams = { ...DEFAULT_PARAMS, ...params };

    // Clamp band indices to valid range
    p.DETECTION_BANDS = p.DETECTION_BANDS.filter((b) => b < nBands);
    p.TMASK_BANDS = p.TMASK_BANDS.filter((b) => b < nBands);
    if (p.DETECTION_BANDS.length === 0) p.DETECTION_BANDS = [0];
    if (p.TMASK_BANDS.length === 0) p.TMASK_BANDS = [0];

    return standardProcedure(dates, obs, p);
}

/**
 * Convenience wrapper for single-band time series (e.g. NDVI).
 *
 * Defaults to SINGLE_BAND_PARAMS (LASSO_LAMBDA=0.002, scaled for 0–1 range).
 * Any field in `params` overrides the SINGLE_BAND_PARAMS default.
 *
 * @param dates  Ordinal day numbers (sorted ascending, length N).
 * @param values Band values (length N).
 * @param params Optional parameter overrides.
 */
export function detectSingleBand(
    dates: number[],
    values: number[],
    params: Partial<CCDCParams> = {},
): CCDCResult {
    // Spread SINGLE_BAND_PARAMS so LASSO_LAMBDA (0.002) and band indices are
    // set correctly for 0–1 range data; caller can override any field via params.
    return detect(dates, [values], {
        ...SINGLE_BAND_PARAMS,
        ...params,
    });
}

/**
 * Convert a JavaScript Date to an ordinal day number compatible with Python's
 * `datetime.date.toordinal()`.  Day 1 = 1 Jan 0001 (proleptic Gregorian).
 * 1 Jan 1970 = ordinal 719163.
 */
export function dateToOrdinal(date: Date | string): number {
    const d = typeof date === 'string' ? new Date(date) : date;
    return Math.floor(d.getTime() / 86_400_000) + 719_163;
}

/**
 * Evaluate a CCDC segment model at arbitrary dates, returning predicted values
 * for each band.
 *
 * @param segment A ChangeSegment returned by detect() or detectSingleBand().
 * @param dates   Ordinal day numbers at which to evaluate the model.
 * @param avgDaysYr Days per year (default 365.2425).
 * @returns       [numBands][numDates] predicted values.
 */
export function evaluateSegment(
    segment: ChangeSegment,
    dates: number[],
    avgDaysYr = 365.2425,
): number[][] {
    return segment.bands.map((b) => {
        const model: FittedModel = {
            intercept: b.intercept,
            coef: b.coefficients,
            numCoef: 4 + (b.coefficients.length > 3 ? (b.coefficients.length > 5 ? 4 : 2) : 0),
            rmse: b.rmse,
            residuals: [],
        };
        return modelPredict(model, dates, avgDaysYr);
    });
}
