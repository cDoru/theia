/********************************************************************************
 * Copyright (C) 2018 Red Hat, Inc. and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import URI from '@theia/core/lib/common/uri';
import { Disposable, Event} from '@theia/core/lib/common';
import { StatusBarEntry } from '@theia/core/lib/browser';

export interface SCMResourceDecorations {
    icon?: URI;
    tooltip?: string;
    strikeThrough?: boolean;
    faded?: boolean;

    source?: string;
    letter?: string;
}

export interface SCMResource {
    readonly resourceGroup: SCMResourceGroup;
    readonly sourceUri: URI;
    readonly decorations?: SCMResourceDecorations;

    open(): Promise<void>;
}

export interface SCMResourceGroup {
    readonly resources: SCMResource[];
    readonly provider: SCMProvider;
    readonly label: string;
    readonly id: string;
    readonly hideWhenEmpty: boolean | undefined;
    readonly onDidChange: Event<void>;
}

export interface SCMProvider extends Disposable {
    readonly label: string;
    readonly id: string;
    readonly contextValue: string;

    readonly groups: SCMResourceGroup[];

    readonly onDidChangeResources: Event<void>;

    readonly rootUri?: string;
    readonly count?: number;
    readonly commitTemplate?: string;
    readonly onDidChangeCommitTemplate?: Event<string>;
    readonly onDidChangeStatusBarCommands?: Event<StatusBarCommand[]>;
    readonly acceptInputCommand?: StatusBarCommand;
    readonly statusBarCommands?: StatusBarCommand[];
    readonly onDidChange: Event<void>;

    getOriginalResource(uri: URI): Promise<URI | undefined>;
}

export interface StatusBarCommand extends StatusBarEntry {
    id: string
}

export const enum InputValidationType {
    Error = 0,
    Warning = 1,
    Information = 2
}

export interface InputValidation {
    message: string;
    type: InputValidationType;
}

export interface InputValidator {
    (value: string, cursorPosition: number): Promise<InputValidation | undefined>;
}

export interface SCMInput {
    value: string;
    readonly onDidChange: Event<string>;

    placeholder: string;
    readonly onDidChangePlaceholder: Event<string>;

    validateInput: InputValidator;
    readonly onDidChangeValidateInput: Event<void>;

    visible: boolean;
    readonly onDidChangeVisibility: Event<boolean>;
}

export interface SCMRepository extends Disposable {
    readonly onDidFocus: Event<void>;
    readonly selected: boolean;
    readonly onDidChangeSelection: Event<boolean>;
    readonly provider: SCMProvider;
    readonly input: SCMInput;

    focus(): void;

    setSelected(selected: boolean): void;
}

export const SCMService = Symbol('SCMService');
export interface SCMService {

    readonly onDidAddRepository: Event<SCMRepository>;
    readonly onDidRemoveRepository: Event<SCMRepository>;

    readonly repositories: SCMRepository[];
    readonly selectedRepositories: SCMRepository[];
    readonly onDidChangeSelectedRepositories: Event<SCMRepository[]>;

    registerSCMProvider(provider: SCMProvider): SCMRepository;
}
