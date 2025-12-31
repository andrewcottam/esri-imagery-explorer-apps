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

import React, { FC, useEffect } from 'react';
import classNames from 'classnames';
import { Button } from '../Button';
import { useAppDispatch, useAppSelector } from '@shared/store/configureStore';
import {
    selectProjects,
    selectSelectedProjectId,
    selectLoadingProjects,
} from '@shared/store/Bookmarks/selectors';
import {
    projectsLoaded,
    projectsLoadingStarted,
    projectSelected,
} from '@shared/store/Bookmarks/reducer';
import { selectFirebaseUser } from '@shared/store/Firebase/selectors';
import { fetchUserProjects } from '@shared/services/firebase/firestore';

export const ProjectsList: FC = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectFirebaseUser);
    const projects = useAppSelector(selectProjects);
    const selectedProjectId = useAppSelector(selectSelectedProjectId);
    const loading = useAppSelector(selectLoadingProjects);

    // Fetch projects when user logs in
    useEffect(() => {
        if (user) {
            const loadProjects = async () => {
                dispatch(projectsLoadingStarted());
                try {
                    const userProjects = await fetchUserProjects(user.uid);
                    dispatch(projectsLoaded(userProjects));
                } catch (error) {
                    console.error('Failed to load projects:', error);
                    dispatch(projectsLoaded([]));
                }
            };
            loadProjects();
        }
    }, [user, dispatch]);

    if (!user) {
        return (
            <div className="text-center text-sm text-custom-light-blue-50 p-4">
                Please sign in to view your bookmarks
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-center text-sm text-custom-light-blue-50 p-4">
                Loading projects...
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="text-center text-sm text-custom-light-blue-50 p-4">
                No projects found. Create a bookmark to get started.
            </div>
        );
    }

    return (
        <>
            {projects.map((project) => (
                <div key={project.id} className={classNames('relative mb-1')}>
                    <Button
                        appearance={
                            project.id === selectedProjectId
                                ? 'solid'
                                : 'transparent'
                        }
                        scale="s"
                        decorativeIndicator={
                            project.id === selectedProjectId ? 'left' : null
                        }
                        onClickHandler={() => {
                            dispatch(projectSelected(project.id));
                        }}
                    >
                        <span className="uppercase">{project.name}</span>
                    </Button>
                </div>
            ))}
        </>
    );
};
