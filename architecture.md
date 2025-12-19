# ESRI Imagery Explorer Apps - Architecture Documentation

## Overview

This is a monorepo containing **7 separate imagery explorer applications** built by the Esri Living Atlas team. Each application is designed to explore and analyze different satellite imagery datasets through an intuitive user interface leveraging ArcGIS capabilities.

### Applications in this Repository

1. **Landsat Explorer** (`/landsatexplorer`) - Explore Landsat satellite imagery
2. **Sentinel-2 Explorer** (`/sentinel2explorer`) - Explore Sentinel-2 multispectral imagery
3. **Sentinel-1 Explorer** (`/sentinel1explorer`) - Explore Sentinel-1 SAR imagery
4. **Land Cover Explorer** (`/landcoverexplorer`) - View Sentinel-2 derived land use/land cover data
5. **NLCD Land Cover Explorer** (`/nlcdlandcoverexplorer`) - Explore National Land Cover Database
6. **Spectral Sampler** (`/spectralsampler`) - Training data collection tool for land cover classification
7. **Surface Temperature** (`/surface-temp`) - Landsat surface temperature archive viewer

## High-Level Architecture

### Technology Stack

- **Framework**: React 19.1.1 with TypeScript 5.5.4
- **Build Tool**: Webpack 5.101.0 (custom configuration)
- **State Management**: Redux Toolkit 2.5 with Redux 5.0.1
- **Styling**: Tailwind CSS 3.3 + Plain CSS (hybrid approach)
- **UI Components**: Esri Calcite Components React 3.2.1
- **Mapping**: ArcGIS JavaScript API 4.33.7
- **Testing**: Jest 29.7.0 + Playwright 1.53.1
- **Internationalization**: i18next 24.2.3

### Architecture Pattern

This is a **multi-entry Webpack configuration** where each application:
- Shares common code from the `/src/shared` directory
- Has its own application-specific code in `/src/{app-name}`
- Is built independently with its own bundle
- Uses the same HTML template but with dynamic metadata

## Project Structure

```
esri-imagery-explorer-apps/
├── src/
│   ├── shared/                      # Shared code across all apps
│   │   ├── components/              # 61+ reusable React components
│   │   ├── services/                # API integration layer
│   │   ├── store/                   # Redux store and slices
│   │   ├── hooks/                   # 20+ custom React hooks
│   │   ├── utils/                   # Utility functions
│   │   ├── styles/                  # Global CSS and variables
│   │   ├── i18n/                    # Internationalization setup
│   │   ├── contexts/                # React Context providers
│   │   ├── config/                  # Configuration files
│   │   ├── constants/               # Shared constants
│   │   └── statics/                 # Static assets
│   │
│   ├── landsat-explorer/            # Landsat-specific code
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── styles/
│   │   ├── utils/
│   │   └── index.tsx                # App entry point
│   │
│   ├── sentinel-2-explorer/         # Sentinel-2-specific code
│   ├── sentinel-1-explorer/
│   ├── landcover-explorer/
│   ├── nlcd-landcover-explorer/
│   ├── spectral-sampling-tool/
│   ├── surface-temp/
│   ├── types/                       # TypeScript type definitions
│   └── config.json                  # App metadata and configuration
│
├── public/
│   ├── index.html                   # HTML template (Webpack processes this)
│   ├── locales/                     # i18n translation JSON files
│   └── thumbnails/                  # App preview images
│
├── e2e/                             # Playwright E2E tests per app
├── scripts/                         # Build and deployment scripts
├── webpack.config.js                # Main build configuration
├── tailwind.config.js               # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
├── jest.config.js                   # Jest testing configuration
└── package.json                     # Dependencies and scripts
```

## Folder Deep Dive

### `/src/shared/components/`

Contains 61+ reusable React components that are shared across all applications. Each component follows a consistent structure:

```
ComponentName/
├── ComponentName.tsx       # Main component logic
├── ComponentName.css       # Component-specific styles (if needed)
└── index.ts               # Named exports
```

**Major Components Include:**
- **Map Components**: `MapView`, `MapViewContainer`, `SwipeWidget`, `MapMagnifier`
- **UI Controls**: `Calendar`, `Button`, `Slider`, `Dropdown`
- **Analysis Tools**: `ChangeCompareTool`, `MaskTool`, `TemporalProfileChart`, `TrendTool`
- **Widgets**: `ScreenshotWidget`, `AnimationDownloadPanel`, `CopyLinkWidget`, `Zoom2NativeScale`
- **Layout**: `AppHeader`, `BottomPanel`, `AnalysisToolSelector`
- **Utilities**: `ErrorBoundary`, `ErrorPage`, `InterestingPlaces`

### `/src/shared/services/`

Service layer organized by data source/domain. All API calls and external integrations are centralized here.

```
services/
├── arcgis-online/              # ArcGIS Online Portal operations
│   ├── account.ts              # User account info
│   ├── addItem.ts              # Add items to portal
│   ├── createWebMap.ts         # Create web maps
│   ├── getUserLicense.ts
│   ├── updateItem.ts
│   └── checkIsServiceNameAvailable.ts
│
├── sentinel-2/                 # Sentinel-2 imagery services
│   ├── getSentinel2Scenes.ts
│   ├── getSentinel2PixelValues.tsx
│   ├── getSentinel2TemporalProfileData.ts
│   ├── getTimeExtent.ts
│   ├── config.ts               # Service URLs
│   └── helpers.ts
│
├── sentinel-1/                 # Sentinel-1 SAR services
├── landsat-level-2/            # Landsat Level 2 data services
├── sentinel-2-10m-landcover/   # Land cover services
├── nlcd-landcover/             # NLCD services
├── raster-analysis/            # ArcGIS Raster Analysis
└── helpers/                    # Shared service helpers
```

### `/src/shared/store/`

Redux store using Redux Toolkit with feature-based slices:

**Store Structure:**
```typescript
// rootReducer.ts
{
    Map,                    // Map state (center, zoom, extent)
    UI,                     // UI visibility and panel state
    ImageryScenes,          // Selected imagery scenes
    ImageryService,         // Service metadata
    Sentinel2,              // Sentinel-2 specific state
    Landsat,                // Landsat specific state
    Sentinel1,              // Sentinel-1 specific state
    LandcoverExplorer,      // Land cover explorer state
    TrendTool,              // Trend analysis state
    MaskTool,               // Masking/filtering state
    SpectralProfileTool,    // Spectral analysis state
    ChangeCompareTool,      // Change detection state
    SpectralSamplingTool,   // Training data collection
    TemporalCompositeTool,  // Temporal compositing
    PublishAndDownloadJobs, // Job tracking
}
```

**Each Redux slice contains:**
- `reducer.ts` - Slice definition with reducers
- `selectors.ts` - Memoized selectors
- `thunks.ts` - Async thunks for API calls (if needed)
- `getPreloadedState.ts` - Initial state loading

### `/src/shared/hooks/`

Custom React hooks for common functionality:

- `useAsync.tsx` - Handle async operations
- `useWindowSize.tsx` - Window resize tracking
- `usePrevious.tsx` - Get previous prop/state value
- `useOnClickOutside.tsx` - Click-outside detection
- `useSaveAppState2HashParams.tsx` - URL state persistence
- `useFindSelectedSceneByDate.tsx` - Scene lookup
- `useSyncRenderers.tsx` - Raster function synchronization
- `useDataOfImageryExplorerApps.tsx` - App data fetching
- `useAvailableAcquisitionYears.tsx` - Year filtering
- `useCalculatePixelArea.tsx` - Area calculations
- `useVisibilityState.tsx` - Document visibility tracking
- And 10+ more specialized hooks

### `/src/shared/utils/`

Utility functions organized by category:

```
utils/
├── date-time/              # Date formatting, timezone handling
├── esri-oauth/             # ArcGIS OAuth integration
├── indexedDB/              # Client-side storage
├── initialize-app/         # App setup and initialization
├── session-storage/        # Session data persistence
├── snippets/               # Code snippets utility
├── temperature-conversion/ # Temperature unit conversion
├── url-hash-params/        # URL hash parameter parsing
├── video-encoder/          # Video export functionality
└── __jest_utils__/         # Jest testing utilities
```

### `/src/shared/styles/`

Global styling files:

- `global.css` - Global styles, theme background with noise pattern
- `variables.css` - CSS custom properties for colors and spacing
- `fancy-scrollbar.css` - Custom scrollbar styling
- `index.css` - CSS entry point

## Styling Approach

The application uses a **hybrid CSS strategy** combining multiple approaches:

### 1. Tailwind CSS (Primary)

Tailwind is the primary styling system for layouts and utilities. Configuration at `tailwind.config.js`:

**Custom Colors:**
```javascript
custom: {
  'light-blue': {
    DEFAULT: 'rgb(191,238,254)',
    90, 80, 70, 60, 50, 40, 30, 25, 20, 10, 5, 0  // Opacity variants
  },
  'background': {
    DEFAULT: 'rgb(0,35,47)',
    95, 90, 85, 80, 70, 60, 50, 40, 30, 20, 10, 5, 0  // Variants
  },
  'calendar': {
    border: { DEFAULT, available, selected },
    background: { DEFAULT, available, selected }
  }
}
```

**Custom Spacing:**
```javascript
spacing: {
  'bottom-panel-height': '236px',
  'app-header-size': '40px',
  'analysis-tool-container-width': '255px',
  'cloud-slider-height': '80px',
  'map-action-button-size': '32px',
  // And more...
}
```

### 2. Plain CSS (Colocated)

Component-specific CSS files sit alongside their React components:

```
/src/shared/components/Button/
├── Button.tsx
└── Button.css        # Component-specific styles
```

**Examples:**
- `Button/Button.css`
- `MapView/CustomMapViewStyle.css`
- `ScreenshotWidget/ScreenshotEffect.css`
- `Slider/Slider.css`

### 3. CSS Variables

CSS custom properties defined in `/src/shared/styles/variables.css` for theming and consistency.

### 4. Processing Pipeline

```
CSS → PostCSS (postcss-preset-env + tailwindcss) → CSS-loader → MiniCssExtractPlugin
```

Configuration in `postcss.config.js`:
```javascript
module.exports = {
  plugins: {
    'postcss-preset-env': {},
    tailwindcss: {},
  },
}
```

## Services and External APIs

### Service Architecture Pattern

Services use **Esri REST API libraries** and are organized by data source:

**Key Libraries:**
- `@arcgis/core` - ArcGIS JavaScript SDK
- `@esri/arcgis-rest-feature-service` - Feature service queries

**Example Service Function:**
```typescript
// /src/shared/services/sentinel-2/getSentinel2Scenes.ts
type GetSentinel2ScenesParams = {
    mapPoint: number[];                  // [lon, lat]
    acquisitionDateRange?: DateRange;    // { startDate, endDate }
    acquisitionMonth?: number;
    acquisitionDate?: string;            // 'YYYY-MM-DD'
    abortController: AbortController;    // Request cancellation
};

// Returns Sentinel2Scene[] objects
```

### External Services Called

1. **ArcGIS Online Portal**
   - User authentication and account management
   - Web map creation and updates
   - Item publishing to portal
   - Service name availability checks

2. **Imagery Feature Services**
   - Sentinel-2 scenes and pixel data
   - Sentinel-1 SAR data
   - Landsat Level 2 scenes
   - Land cover classification data
   - NLCD land cover data

3. **ArcGIS Raster Analysis Service**
   - Image processing operations
   - Raster function execution

### Environment Configuration

All service URLs are injected via Webpack `DefinePlugin` from environment variables:

```
ENV_SENTINEL2_PROXY_SERVICE_URL
ENV_LANDSAT_LEVEL_2_ORIGINAL_SERVICE_URL
ENV_RASTER_ANALYSIS_ROOT_URL
ENV_ARCGIS_PORTAL_ROOT_URL
// And 100+ more configuration values
```

Environment files:
- `.env` - Default configuration
- `.env.development` - Development overrides
- `.env.production` - Production configuration
- `.env.template` - Template with all required variables

## State Management

### Redux with Redux Toolkit

**Store Configuration:**
```typescript
// /src/shared/store/configureStore.ts
const store = configureStore({
    reducer: rootReducer,
    preloadedState,  // App-specific initial state
});

// Custom typed hooks
export const useAppDispatch = useDispatch.withTypes<StoreDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

**Normalized State Pattern:**

Imagery scenes are stored in a normalized format for efficient lookups:

```typescript
{
    byObjectId: {
        [objectId: number]: Sentinel2Scene
    },
    objectIds: number[]
}
```

### App-Specific Store Initialization

Each application initializes its own store with app-specific preloaded state:

```typescript
// /src/landsat-explorer/store/index.ts
export const getLandsatExplorerStore = async () => {
    const preloadedState = await getPreloadedState();
    return configureAppStore(preloadedState);
};
```

## Routing

### No Traditional Client-Side Routing

This is a **single-page application per build** - there is no client-side routing library (React Router, etc.) within individual apps.

### Multi-App Routing

Routing happens at the **build/deployment level**. Each app is built separately and deployed to its own path:
- `/landsatexplorer/`
- `/sentinel2explorer/`
- `/sentinel1explorer/`
- `/landcoverexplorer/`
- `/nlcdlandcoverexplorer/`
- `/spectralsampler/`
- `/surface-temp/`

### URL State Persistence

Apps use **hash parameters** to persist state in the URL:

```typescript
// /src/shared/hooks/useSaveAppState2HashParams.tsx
// Persists app state (selected scenes, zoom, pan, filters) to URL hash
// Enables: shareable links, browser back/forward, bookmarkability
```

## Build System (Webpack 5)

### Dynamic Multi-Entry Configuration

Webpack dynamically builds different apps based on environment variables:

```bash
# Start/build specific app
npm run start:sentinel2      # Development server
npm run build:sentinel2      # Production build
npm run start:landsat:prod   # Dev server with production env
```

### Key Webpack Features

**Entry/Output:**
```javascript
entry: entrypoint,  // From config.json: ./src/{app}/index.tsx
output: {
    path: `./dist/${app}`,
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
    publicPath: '/esri-imagery-explorer-apps/'
}
```

**Loaders:**
- `babel-loader` - Transpile TypeScript/JSX via Babel
- `css-loader` + `postcss-loader` - Process CSS with Tailwind
- `MiniCssExtractPlugin.loader` - Extract CSS in production
- Asset loaders for fonts and images (woff2, ttf, png, jpg, svg)

**Key Plugins:**
- **HtmlWebpackPlugin** - Generate HTML with dynamic meta tags (title, description, OG tags)
- **ForkTsCheckerWebpackPlugin** - Type checking (Babel doesn't check types)
- **DefinePlugin** - Inject 100+ environment variables
- **MiniCssExtractPlugin** - Extract CSS to separate files
- **CopyPlugin** - Copy locales and thumbnails to dist
- **TerserPlugin** - Minify JavaScript (drops console logs in production)
- **CssMinimizerPlugin** - Minify CSS

**Dev Server:**
```javascript
devServer: {
    server: 'https',
    host: 'localhost',
    port: 8080,
    allowedHosts: 'all'
}
```

**Optimization:**
```javascript
optimization: {
    minimizer: [TerserPlugin, CssMinimizerPlugin],
    innerGraph: false  // Prevents "Uncaught ReferenceError" in production
}
```

## UI Component Library

### Esri Calcite Components

Primary UI library: **@esri/calcite-components-react** (v3.2.1)

Calcite is Esri's design system for ArcGIS applications, providing:
- Consistent design language
- Accessibility built-in
- Web components wrapped for React
- Dark theme support

### Custom Components

164+ custom React component files in `/src/shared/components/` following this pattern:

```tsx
// Example: Button component
interface ButtonProps {
    appearance?: 'solid' | 'transparent';
    scale?: 's' | 'm';
    decorativeIndicator?: 'left' | 'right';
    disabled?: boolean;
    onClickHandler: () => void;
    children?: React.ReactNode;
}

export const Button: FC<ButtonProps> = ({ ... }) => {
    return (
        <div className={classNames(
            'relative p-2 px-0 border min-w-[8rem]',
            { /* Conditional Tailwind classes */ }
        )}>
            {children}
        </div>
    );
};
```

## Internationalization (i18n)

### Setup

- **Library**: i18next with HTTP backend
- **Language files**: `/public/locales/{locale}/{namespace}.json`
- **Structure**: `common.json` + app-specific translation files

### Supported Locales

- **Landsat Explorer**: `en`
- **Sentinel-2 Explorer**: `en`, `es`
- **Other apps**: `en` (with infrastructure for expansion)

### Usage

```typescript
const { t } = useTranslation();
const label = t('translation.key');
```

## Testing Infrastructure

### Unit & Integration Testing

- **Framework**: Jest 29.7.0 with jsdom environment
- **React Testing**: React Testing Library 16.3.0
- **Test location**: Colocated with components (`Component.test.tsx`)

**Run tests:**
```bash
npm test
```

### End-to-End Testing

- **Framework**: Playwright 1.53.1
- **Test configs**: Per-app configs in `/e2e/`
  - `playwright.sentinel2.config.ts`
  - `playwright.landsat.config.ts`
  - `playwright.sentinel1.config.ts`
  - `playwright.landcover.config.ts`

**Run E2E tests:**
```bash
npm run e2e:sentinel2
npm run e2e:sentinel2:headed  # With browser UI
```

### Code Quality

- **ESLint** with TypeScript support
- **Prettier** for code formatting
- **Husky** + **lint-staged** for pre-commit hooks

**Pre-commit checks:**
```json
"lint-staged": {
  "src/**/*.{ts,tsx,json}": [
    "prettier --write",
    "eslint src --fix",
    "jest --bail --findRelatedTests --passWithNoTests"
  ]
}
```

## Configuration Management

### Three-Tier Configuration System

1. **Webpack DefinePlugin** (100+ variables)
   - Injected at build time
   - App name, service URLs, API keys
   - Accessible via global constants

2. **Environment Files** (`.env.*`)
   - Service URLs
   - OAuth client IDs
   - Portal URLs
   - Feature flags

3. **JSON Config** (`/src/config.json`)
   - App metadata (title, description)
   - Entry points
   - Supported locales per app
   - URL pathnames

## Data Flow

```
User Interaction
    ↓
React Component
    ↓
Custom Hook / Event Handler
    ↓
Redux Action Dispatch
    ↓
Async Thunk (if API call needed)
    ↓
Service Layer (/src/shared/services/)
    ↓
External API (ArcGIS REST Services)
    ↓
Response Processing
    ↓
Redux State Update
    ↓
Component Re-render (via useAppSelector)
    ↓
UI Update
```

## Performance Optimizations

1. **Code Splitting**: Webpack creates separate bundles for each app
2. **Content Hashing**: Cache-busting via `[contenthash]` in filenames
3. **CSS Extraction**: Separate CSS files in production
4. **Minification**: Terser for JS, CssMinimizerPlugin for CSS
5. **Request Cancellation**: AbortController in all service calls
6. **Memoization**: Redux selectors are memoized
7. **Normalized State**: Efficient data lookups via object IDs

## Development Workflow

### Getting Started

```bash
# Install dependencies
npm install

# Start development server for specific app
npm run start:sentinel2
npm run start:landsat
npm run start:landcover

# Build for production
npm run build:sentinel2
npm run build:landsat:prod  # With production env vars

# Run tests
npm test                     # Unit tests
npm run e2e:sentinel2       # E2E tests

# Code quality
npm run lint                # ESLint with auto-fix
npm run format              # Prettier formatting
```

### Environment Setup

1. Copy `.env.template` to `.env`
2. Fill in required environment variables:
   - ArcGIS Portal URLs
   - Service endpoints
   - OAuth client IDs
   - API keys

### Adding a New App

1. Create app directory: `/src/new-app/`
2. Add entry point: `/src/new-app/index.tsx`
3. Update `/src/config.json` with app metadata
4. Add npm scripts in `package.json`
5. Create Playwright config if E2E tests needed

## Deployment

### Build Process

```bash
# Build specific app with environment
npm run build:sentinel2:prod
```

Output: `/dist/sentinel2explorer/`
- `index.html`
- `main.[hash].js`
- `main.[hash].css`
- `/locales/` (copied)
- `/thumbnails/` (copied)

### GitHub Pages Deployment

Uses `gh-pages` package:

```bash
npm run predeploy:sentinel2  # Builds first
npm run deploy:sentinel2     # Deploys to gh-pages branch
```

## Key Dependencies

### Core
- **react**: 19.1.1
- **react-dom**: 19.1.1
- **typescript**: 5.5.4

### State Management
- **@reduxjs/toolkit**: 2.5
- **react-redux**: 9.2
- **redux**: 5.0.1

### GIS & Mapping
- **@arcgis/core**: 4.33.7
- **@esri/arcgis-rest-feature-service**: 4.0.4
- **@esri/calcite-components-react**: 3.2.1

### Styling
- **tailwindcss**: 3.3
- **postcss**: 8.4
- **autoprefixer**: 10.4.21
- **classnames**: 2.2.6

### Utilities
- **date-fns**: 2.30.0
- **date-fns-tz**: 2.0.0
- **nanoid**: 5.0.9
- **jszip**: 3.10.1
- **i18next**: 24.2.3
- **react-i18next**: 15.4.1

### Build & Dev Tools
- **webpack**: 5.101.0
- **babel-loader**: 10.0.0
- **jest**: 29.7.0
- **@playwright/test**: 1.53.1
- **eslint**: 8.54
- **prettier**: 3.6.2

## Architecture Diagrams

### High-Level System Architecture

```
┌──────────────────────────────────────────────┐
│         Single HTML Entry Point              │
│    (Dynamically Built by Webpack)            │
└──────────────┬───────────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────┐          ┌─────▼─────┐
│ Redux  │          │ Context   │
│ Store  │          │ API       │
└───┬────┘          └───────────┘
    │
┌───▼─────────────────────────────────────────┐
│      React Component Tree                    │
│  • Calcite Components                        │
│  • 164+ Custom Components                    │
│  • 20+ Custom Hooks                          │
└───┬─────────────────────────────────────────┘
    │
┌───▼─────────────────────────────────────────┐
│         Service Layer                        │
│  (8 API domains, REST client)                │
└───┬─────────────────────────────────────────┘
    │
┌───▼─────────────────────────────────────────┐
│        External Services                     │
│  • ArcGIS Online Portal                      │
│  • Imagery Feature Services (REST APIs)      │
│  • Raster Analysis Service                   │
└──────────────────────────────────────────────┘
```

### Build Process Flow

```
config.json
     │
     ├─→ App Selection (env.app)
     │
     ├─→ Load .env file
     │
     ├─→ Webpack Entry Point (app/index.tsx)
     │
     ├─→ TypeScript/JSX → Babel → JavaScript
     │
     ├─→ CSS/Tailwind → PostCSS → Extracted CSS
     │
     ├─→ HTML Template → HtmlWebpackPlugin → index.html
     │
     └─→ Output: /dist/{app}/
           ├── index.html
           ├── main.[hash].js
           └── main.[hash].css
```

## Best Practices & Conventions

1. **Component Structure**: Each component in its own folder with colocated styles
2. **TypeScript**: Strong typing throughout, use interfaces for props
3. **Redux Slices**: Feature-based slices, normalize complex data
4. **Services**: All API calls go through service layer
5. **Hooks**: Extract reusable logic into custom hooks
6. **Styling**: Tailwind for utilities, CSS for component-specific styles
7. **Testing**: Colocate tests with components
8. **Environment**: Never commit `.env` files, use `.env.template`
9. **Git**: Pre-commit hooks enforce code quality

## Common Patterns

### Fetching Data

```typescript
// In a component
const dispatch = useAppDispatch();

useEffect(() => {
    const controller = new AbortController();

    dispatch(fetchSentinel2Scenes({
        mapPoint: [lon, lat],
        acquisitionDateRange,
        abortController: controller
    }));

    return () => controller.abort();
}, [mapPoint, acquisitionDateRange]);
```

### Selecting State

```typescript
const scenes = useAppSelector(selectSentinel2Scenes);
const selectedScene = useAppSelector(selectSelectedSentinel2Scene);
```

### Styling Pattern

```tsx
<div className={classNames(
    'flex items-center justify-between',
    'px-4 py-2',
    'bg-custom-background',
    {
        'opacity-50': disabled,
        'cursor-pointer': !disabled
    }
)}>
```

## Troubleshooting

### Common Issues

1. **"Uncaught ReferenceError" in production**
   - Solution: `optimization.innerGraph: false` in webpack.config.js

2. **Environment variables not loading**
   - Check `.env` file exists and matches `.env.template`
   - Verify Webpack DefinePlugin is processing the env file

3. **Type errors during build**
   - ForkTsCheckerWebpackPlugin runs type checking separately
   - Check console output for TypeScript errors

4. **CSS not applying**
   - Ensure Tailwind content paths include all source files
   - Check PostCSS is processing the CSS
   - Verify CSS import order in index.tsx

## Future Considerations

- Consider migrating to Vite for faster builds
- Evaluate React Router for apps needing multiple views
- Consider server-side rendering for SEO
- Explore micro-frontend architecture for better code splitting
- Consider upgrading to newer React features (Server Components, etc.)

## Additional Resources

- [Webpack Documentation](https://webpack.js.org/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [ArcGIS JavaScript API](https://developers.arcgis.com/javascript/)
- [Calcite Design System](https://developers.arcgis.com/calcite-design-system/)

---

**Last Updated**: 2025-12-19
**Maintainer**: ArcGIS Living Atlas Team
