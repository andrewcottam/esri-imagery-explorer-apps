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

type AddBookmarkDialogProps = {
    onClose: () => void;
    onSave: (projectName: string, bookmarkName: string) => void;
};

const TEXT_INPUT_STYLE = `w-full bg-transparent border border-custom-light-blue-50 p-2 text-sm outline-none placeholder:text-custom-light-blue-25 focus:border-custom-light-blue`;

export const AddBookmarkDialog: FC<AddBookmarkDialogProps> = ({
    onClose,
    onSave,
}) => {
    const [projectName, setProjectName] = useState<string>('');
    const [bookmarkName, setBookmarkName] = useState<string>('');

    const okButtonDisabled = projectName === '' || bookmarkName === '';

    const handleSave = () => {
        if (!okButtonDisabled) {
            onSave(projectName, bookmarkName);
        }
    };

    return (
        <div
            className="fixed top-0 left-0 w-full h-full bg-custom-background-90 backdrop-blur-sm z-10 flex justify-center"
            data-testid="add-bookmark-dialog"
        >
            <div className="mx-4 md:max-w-3xl w-full mt-48 ">
                <div className="mb-4 ">
                    <h3 className="text-xl">Add Spatial Bookmark</h3>
                </div>

                <div>
                    <h4 className="mb-1 font-light text-sm">Project Name</h4>
                    <input
                        className={TEXT_INPUT_STYLE}
                        placeholder="Enter project name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !okButtonDisabled) {
                                handleSave();
                            }
                        }}
                    ></input>
                </div>

                <div className="mt-4">
                    <h4 className="mb-1 font-light text-sm">Bookmark Name</h4>
                    <input
                        className={TEXT_INPUT_STYLE}
                        placeholder="Enter bookmark name"
                        value={bookmarkName}
                        onChange={(e) => setBookmarkName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !okButtonDisabled) {
                                handleSave();
                            }
                        }}
                    ></input>
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
