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
import {
    InputValidator,
    SCMInput,
    SCMProvider,
    SCMRepository,
    SCMService
} from '../common/scm';
import { Disposable, Emitter, Event } from '@theia/core/lib/common';
import { injectable } from 'inversify';

function toDisposable(fn: () => void): Disposable {
    return { dispose() { fn(); } };
}

@injectable()
export class SCMServiceImpl implements SCMService {
    private _providerIds = new Set<string>();
    private _repositories: SCMRepository[] = [];
    get repositories(): SCMRepository[] { return [...this._repositories]; }

    private _selectedRepositories: SCMRepository[] = [];
    get selectedRepositories(): SCMRepository[] { return [...this._selectedRepositories]; }

    private _onDidChangeSelectedRepositories = new Emitter<SCMRepository[]>();
    readonly onDidChangeSelectedRepositories: Event<SCMRepository[]> = this._onDidChangeSelectedRepositories.event;

    private _onDidAddProvider = new Emitter<SCMRepository>();
    get onDidAddRepository(): Event<SCMRepository> { return this._onDidAddProvider.event; }

    private _onDidRemoveProvider = new Emitter<SCMRepository>();
    get onDidRemoveRepository(): Event<SCMRepository> { return this._onDidRemoveProvider.event; }

    registerSCMProvider(provider: SCMProvider): SCMRepository {

        if (this._providerIds.has(provider.id)) {
            throw new Error(`SCM Provider ${provider.id} already exists.`);
        }

        this._providerIds.add(provider.id);

        const disposable = toDisposable(() => {
            const index = this._repositories.indexOf(repository);

            if (index < 0) {
                return;
            }

            selectedDisposable.dispose();
            this._providerIds.delete(provider.id);
            this._repositories.splice(index, 1);
            this._onDidRemoveProvider.fire(repository);
            this.onDidChangeSelection();
        });

        const repository = new SCMRepositoryImpl(provider, disposable);
        const selectedDisposable = repository.onDidChangeSelection(this.onDidChangeSelection, this);

        this._repositories.push(repository);
        this._onDidAddProvider.fire(repository);

        // automatically select the first repository
        if (this._repositories.length === 1) {
            repository.setSelected(true);
        }

        return repository;
    }

    private onDidChangeSelection(): void {
        this._selectedRepositories = this._repositories.filter(r => r.selected);
        this._onDidChangeSelectedRepositories.fire(this.selectedRepositories);
    }
}

class SCMRepositoryImpl implements SCMRepository {

    private _onDidFocus = new Emitter<void>();
    readonly onDidFocus: Event<void> = this._onDidFocus.event;

    private _selected = false;
    get selected(): boolean {
        return this._selected;
    }

    private _onDidChangeSelection = new Emitter<boolean>();
    readonly onDidChangeSelection: Event<boolean> = this._onDidChangeSelection.event;

    readonly input: SCMInput = new SCMInputImpl();

    constructor(
        public readonly provider: SCMProvider,
        private disposable: Disposable
    ) { }

    focus(): void {
        this._onDidFocus.fire(undefined);
    }

    setSelected(selected: boolean): void {
        this._selected = selected;
        this._onDidChangeSelection.fire(selected);
    }

    dispose(): void {
        this.disposable.dispose();
        this.provider.dispose();
    }
}

class SCMInputImpl implements SCMInput {

    private _value = '';

    get value(): string {
        return this._value;
    }

    set value(value: string) {
        this._value = value;
        this._onDidChange.fire(value);
    }

    private _onDidChange = new Emitter<string>();
    get onDidChange(): Event<string> { return this._onDidChange.event; }

    private _placeholder = '';

    get placeholder(): string {
        return this._placeholder;
    }

    set placeholder(placeholder: string) {
        this._placeholder = placeholder;
        this._onDidChangePlaceholder.fire(placeholder);
    }

    private _onDidChangePlaceholder = new Emitter<string>();
    get onDidChangePlaceholder(): Event<string> { return this._onDidChangePlaceholder.event; }

    private _visible = true;

    get visible(): boolean {
        return this._visible;
    }

    set visible(visible: boolean) {
        this._visible = visible;
        this._onDidChangeVisibility.fire(visible);
    }

    private _onDidChangeVisibility = new Emitter<boolean>();
    get onDidChangeVisibility(): Event<boolean> { return this._onDidChangeVisibility.event; }

    private _validateInput: InputValidator = () => Promise.resolve(undefined);

    get validateInput(): InputValidator {
        return this._validateInput;
    }

    set validateInput(validateInput: InputValidator) {
        this._validateInput = validateInput;
        this._onDidChangeValidateInput.fire(undefined);
    }

    private _onDidChangeValidateInput = new Emitter<void>();
    get onDidChangeValidateInput(): Event<void> { return this._onDidChangeValidateInput.event; }
}
