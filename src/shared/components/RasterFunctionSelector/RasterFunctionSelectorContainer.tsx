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

import React, { FC, useEffect, useMemo, useState } from 'react';
import { RasterFunctionSelector } from './RasterFunctionSelector';
import { useAppDispatch } from '@shared/store/configureStore';
import { useAppSelector } from '@shared/store/configureStore';
import {
    selectActiveAnalysisTool,
    selectAppMode,
    selectQueryParams4SceneInSelectedMode,
} from '@shared/store/ImageryScene/selectors';
import { updateRasterFunctionName } from '@shared/store/ImageryScene/thunks';
import { selectIsAnimationPlaying } from '@shared/store/UI/selectors';
import { updateTooltipData } from '@shared/store/UI/thunks';
import { RasterFunctionInfo } from '@typing/imagery-service';
import { selectChangeCompareLayerIsOn } from '@shared/store/ChangeCompareTool/selectors';
import { selectIsTemporalCompositeLayerOn } from '@shared/store/TemporalCompositeTool/selectors';
import { selectFirebaseUser } from '@shared/store/Firebase/selectors';
import { AddRendererDialog } from '../AddRendererDialog/AddRendererDialog';
import {
    saveRenderer,
    deleteRenderer,
} from '@shared/services/firebase/firestore';
import {
    selectCustomRenderers,
    selectPendingScreenshotRendererId,
} from '@shared/store/Renderers/selectors';
import {
    pendingScreenshotRendererIdSet,
    customRendererDeleted,
    customRendererAdded,
} from '@shared/store/Renderers/reducer';

type Props = {
    /**
     * tooltip text that will be displayed when user hovers the info icon next to the header
     */
    headerTooltip: string;
    /**
     * The width of header tooltip container in px. The default width is 240px and this value can be used to override that value
     */
    widthOfTooltipContainer?: number;
    /**
     * list of raster functions of the imagery service
     */
    data: RasterFunctionInfo[];
};

export const RasterFunctionSelectorContainer: FC<Props> = ({
    headerTooltip,
    widthOfTooltipContainer,
    data,
}) => {
    const dispatch = useAppDispatch();

    const mode = useAppSelector(selectAppMode);

    const analysisTool = useAppSelector(selectActiveAnalysisTool);

    const isAnimationPlaying = useAppSelector(selectIsAnimationPlaying);

    // const rasterFunctionInfo = useRasterFunctionInfo();

    const isChangeCompareLayerOn = useAppSelector(selectChangeCompareLayerIsOn);

    const isTemporalCompositeLayerOn = useAppSelector(
        selectIsTemporalCompositeLayerOn
    );

    const { rasterFunctionName, objectIdOfSelectedScene } =
        useAppSelector(selectQueryParams4SceneInSelectedMode) || {};

    const firebaseUser = useAppSelector(selectFirebaseUser);

    const customRenderers = useAppSelector(selectCustomRenderers);

    const [showAddRendererDialog, setShowAddRendererDialog] = useState(false);
    const [isSavingRenderer, setIsSavingRenderer] = useState(false);

    const shouldDisable = () => {
        if (mode === 'dynamic') {
            return false;
        }

        // Allow renderer selection when temporal composite is active
        if (isTemporalCompositeLayerOn) {
            return false;
        }

        if (
            // !rasterFunctionName ||
            isAnimationPlaying ||
            !objectIdOfSelectedScene
        ) {
            return true;
        }

        if (
            mode === 'analysis' &&
            analysisTool === 'change' &&
            isChangeCompareLayerOn
        ) {
            return true;
        }

        return false;
    };

    const handleSaveRenderer = async (name: string, rendererJson: string) => {
        if (!firebaseUser || isSavingRenderer) {
            return;
        }

        setIsSavingRenderer(true);

        try {
            const renderer = JSON.parse(rendererJson);
            const savedRenderer = await saveRenderer(
                name,
                renderer,
                firebaseUser
            );

            // Update Redux state
            dispatch(customRendererAdded(savedRenderer));

            console.log('Renderer saved successfully');
            setShowAddRendererDialog(false);
        } catch (error) {
            console.error('Error saving renderer:', error);
            alert(`Error saving renderer: ${error.message || error}`);
        } finally {
            setIsSavingRenderer(false);
        }
    };

    const handleDeleteRenderer = async () => {
        if (!firebaseUser || !rasterFunctionName) {
            return;
        }

        // Find the custom renderer by matching the rasterFunction name
        const customRenderer = customRenderers.find((r) => {
            const rasterFunction = (r.renderer as any)?.rasterFunction;
            return rasterFunction === rasterFunctionName;
        });

        if (!customRenderer) {
            console.error('Selected renderer is not a custom renderer');
            return;
        }

        try {
            // Delete from Firestore
            await deleteRenderer(customRenderer.id, firebaseUser.uid);

            // Update Redux state
            dispatch(customRendererDeleted(customRenderer.id));

            console.log('Renderer deleted successfully');
        } catch (error) {
            console.error('Failed to delete renderer:', error);
            alert('Failed to delete renderer. Please try again.');
        }
    };

    // Determine if the selected renderer is a custom renderer
    const isSelectedRendererCustom = useMemo(() => {
        if (!rasterFunctionName || !customRenderers.length) {
            return false;
        }

        return customRenderers.some((r) => {
            const rasterFunction = (r.renderer as any)?.rasterFunction;
            return rasterFunction === rasterFunctionName;
        });
    }, [rasterFunctionName, customRenderers]);

    if (!data || !data.length) {
        return null;
    }

    // if (mode === 'analysis' && analysisTool === 'change') {
    //     return null;
    // }

    return (
        <>
            <RasterFunctionSelector
                headerTooltip={headerTooltip}
                rasterFunctionInfo={data}
                nameOfSelectedRasterFunction={rasterFunctionName}
                disabled={shouldDisable()}
                widthOfTooltipContainer={widthOfTooltipContainer}
                showAddIcon={!!firebaseUser}
                onAddClick={() => setShowAddRendererDialog(true)}
                showDeleteIcon={isSelectedRendererCustom}
                onDeleteClick={handleDeleteRenderer}
                onChange={(rasterFunctionName, rasterFunctionInfo) => {
                    // Check if this is a custom renderer without an image
                    if (
                        rasterFunctionInfo?.rasterFunctionDefinition &&
                        !rasterFunctionInfo.legend &&
                        !rasterFunctionInfo.thumbnail
                    ) {
                        // Find the custom renderer by matching the rasterFunction name
                        const customRenderer = customRenderers.find((r) => {
                            const rasterFunction = (r.renderer as any)
                                ?.rasterFunction;
                            return rasterFunction === rasterFunctionName;
                        });

                        // If found and doesn't have an image, mark it for screenshot capture
                        if (customRenderer && !customRenderer.image) {
                            dispatch(
                                pendingScreenshotRendererIdSet(customRenderer.id)
                            );
                        }
                    }

                    dispatch(
                        updateRasterFunctionName(
                            rasterFunctionName,
                            rasterFunctionInfo?.rasterFunctionDefinition
                        )
                    );
                }}
                itemOnHover={(rasterFunctionData) => {
                    const { label, description, legend } =
                        rasterFunctionData || {};

                    const data = rasterFunctionData
                        ? {
                              title: label,
                              content: description,
                              legendImage: legend,
                          }
                        : null;

                    dispatch(updateTooltipData(data));
                }}
            />

            {showAddRendererDialog && (
                <AddRendererDialog
                    onClose={() => setShowAddRendererDialog(false)}
                    onSave={handleSaveRenderer}
                />
            )}
        </>
    );
};
