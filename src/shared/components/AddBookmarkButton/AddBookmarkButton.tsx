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

import React, { FC, useState } from 'react';
import MapView from '@arcgis/core/views/MapView';
import { MapActionButton } from '../MapActionButton/MapActionButton';
import { AddBookmarkDialog } from '../AddBookmarkDialog/AddBookmarkDialog';
import { saveSpatialBookmark } from '@shared/services/firebase/firestore';
import { useAppSelector } from '@shared/store/configureStore';
import { selectFirebaseUser } from '@shared/store/Firebase/selectors';

type Props = {
    mapView?: MapView;
};

export const AddBookmarkButton: FC<Props> = ({ mapView }) => {
    const user = useAppSelector(selectFirebaseUser);
    const [showDialog, setShowDialog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Only show the button if user is logged in
    if (!user) {
        return null;
    }

    const handleSave = async (projectName: string, bookmarkName: string) => {
        if (!mapView || !user) {
            return;
        }

        setIsSaving(true);

        try {
            // Get current map view data
            const center = [mapView.center.longitude, mapView.center.latitude];
            const zoom = mapView.zoom;
            const extent = {
                xmin: mapView.extent.xmin,
                ymin: mapView.extent.ymin,
                xmax: mapView.extent.xmax,
                ymax: mapView.extent.ymax,
            };

            // Save to Firestore
            await saveSpatialBookmark(
                projectName,
                bookmarkName,
                { center, zoom, extent },
                user.uid
            );

            // Close the dialog
            setShowDialog(false);

            // Show success message (you could add a notification here)
            console.log('Bookmark saved successfully!');
        } catch (error) {
            console.error('Failed to save bookmark:', error);
            // You could add error notification here
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <MapActionButton
                tooltip="Add Spatial Bookmark"
                showLoadingIndicator={isSaving}
                onClickHandler={() => setShowDialog(true)}
            >
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width={24}
                        height={24}
                    >
                        <path
                            fill="currentColor"
                            d="M19 1v21.5l-7-5.447-7 5.447V1zm-1 1H6v17.657l6-4.67 6 4.67z"
                        />
                        <path
                            fill="currentColor"
                            d="M12.5 6h-1v3.5H8v1h3.5V14h1v-3.5H16v-1h-3.5z"
                        />
                        <path fill="none" d="M0 0h24v24H0z" />
                    </svg>
                </div>
            </MapActionButton>

            {showDialog && (
                <AddBookmarkDialog
                    onClose={() => setShowDialog(false)}
                    onSave={handleSave}
                />
            )}
        </>
    );
};
