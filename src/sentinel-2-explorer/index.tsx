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

// import '@arcgis/core/assets/esri/themes/dark/main.css';
import '@shared/styles/index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import ErrorBoundary from '@shared/components/ErrorBoundary/ErrorBoundary';
import { ErrorPage } from '@shared/components/ErrorPage';
import { getSentinel2ExplorerStore } from './store';
import Map from './components/Map/Map';
import Layout from './components/Layout/Layout';
import { initEsriOAuth } from '@shared/utils/esri-oauth';
import { AGOL_PORTAL_ROOT, SENTINEL2_EXPLORER_APP_ID } from '@shared/config';
import { AboutSentinel2Explorer } from './components/About';
import '@shared/components/calcite-components';
import { initializeApp } from '@shared/utils/initialize-app/initializeApp';
import { initializeFirebase } from '@shared/services/firebase/auth';

(async () => {
    const root = createRoot(document.getElementById('root'));

    try {
        await initializeApp({
            appId: SENTINEL2_EXPLORER_APP_ID,
        });

        const store = await getSentinel2ExplorerStore();

        // Initialize Firebase with the store dispatch
        initializeFirebase(store.dispatch);

        root.render(
            <ReduxProvider store={store}>
                <ErrorBoundary>
                    <Map />
                    <Layout />
                    <AboutSentinel2Explorer />
                </ErrorBoundary>
            </ReduxProvider>
        );
    } catch (err) {
        console.log(err);
        root.render(<ErrorPage error={err} />);
    }
})();
