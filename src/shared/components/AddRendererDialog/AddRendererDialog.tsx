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

import { Button } from '@shared/components/Button';
import React, { FC, useState } from 'react';

type AddRendererDialogProps = {
    onClose: () => void;
    onSave: (name: string, renderer: string) => void;
};

const TEXT_INPUT_STYLE = `w-full bg-transparent border border-custom-light-blue-50 p-2 text-sm outline-none placeholder:text-custom-light-blue-25 focus:border-custom-light-blue`;

export const AddRendererDialog: FC<AddRendererDialogProps> = ({
    onClose,
    onSave,
}) => {
    const [name, setName] = useState<string>('');
    const [renderer, setRenderer] = useState<string>('');
    const [jsonError, setJsonError] = useState<string>('');

    const validateJson = (value: string) => {
        if (value === '') {
            setJsonError('');
            return false;
        }

        try {
            JSON.parse(value);
            setJsonError('');
            return true;
        } catch (error) {
            setJsonError('Invalid JSON');
            return false;
        }
    };

    const handleRendererChange = (value: string) => {
        setRenderer(value);
        validateJson(value);
    };

    const okButtonDisabled =
        name === '' || renderer === '' || jsonError !== '';

    const handleSave = () => {
        if (!okButtonDisabled) {
            onSave(name, renderer);
        }
    };

    return (
        <div
            className="fixed top-0 left-0 w-full h-full bg-custom-background-90 backdrop-blur-sm z-10 flex justify-center"
            data-testid="add-renderer-dialog"
        >
            <div className="mx-4 md:max-w-3xl w-full mt-48 ">
                <div className="mb-4 ">
                    <h3 className="text-xl">Add Custom Renderer</h3>
                </div>

                <div>
                    <h4 className="mb-1 font-light text-sm">Renderer Name</h4>
                    <input
                        className={TEXT_INPUT_STYLE}
                        placeholder="Enter renderer name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !okButtonDisabled) {
                                handleSave();
                            }
                        }}
                    ></input>
                </div>

                <div className="mt-4">
                    <h4 className="mb-1 font-light text-sm">
                        Renderer (JSON)
                    </h4>
                    <textarea
                        className={`${TEXT_INPUT_STYLE} min-h-[200px] font-mono text-xs`}
                        placeholder='Enter renderer JSON, e.g. {"rasterFunction": "Agriculture"}'
                        value={renderer}
                        onChange={(e) => handleRendererChange(e.target.value)}
                    ></textarea>
                    {jsonError && (
                        <div className="mt-1 text-red-500 text-xs">
                            {jsonError}
                        </div>
                    )}
                </div>

                <div className=" mt-8 flex justify-end items-center">
                    <div className=" mr-8 cursor-pointer" onClick={onClose}>
                        <span className="uppercase">Cancel</span>
                    </div>

                    <Button
                        onClickHandler={handleSave}
                        scale="s"
                        appearance="transparent"
                        disabled={okButtonDisabled}
                    >
                        OK
                    </Button>
                </div>
            </div>
        </div>
    );
};
