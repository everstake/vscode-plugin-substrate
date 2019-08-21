import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { AccountsTreeView } from "@/trees";
import { MultiStepInput } from '@/common';
import { KeypairType } from '@polkadot/util-crypto/types';

type AccountInfo = { name: string, key: string, type: KeypairType };

export class AddAccountCommand extends BaseCommand {
    options = {
        title: 'Add account',
        totalSteps: 3,
        ignoreFocusOut: true,
    };

    async run() {
        const state = {} as Partial<AccountInfo>;
        const result = await MultiStepInput.run(input => this.addName(input, state));
        if (!result) {
            console.log('Account wasn\'t added');
            return;
        }
        const value = state as AccountInfo;

        this.substrate.createKeyringPair(value.key, value.name, value.type);

        const tree = this.trees.get('accounts') as AccountsTreeView;
        tree.refresh();
    }

    async addName(input: MultiStepInput, state: Partial<AccountInfo>) {
        state.name = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'Account name',
            placeholder: 'ex. Alice',
            value: (typeof state.name === 'string') ? state.name : '',
            validate: async (value) => {
                if (!value || !value.trim()) {
                    return 'Name is required';
                }
                if (this.substrate.isAccountExists(value)) {
                    return 'Account with same name already exists';
                }
                return '';
            }
        });
        return (input: MultiStepInput) => this.addType(input, state);
    }

    async addType(input: MultiStepInput, state: Partial<AccountInfo>) {
        const type = await input.showQuickPick({
            ...this.options,
            step: input.CurrentStepNumber,
            items: [{
                label: 'ed25519',
            }, {
                label: 'sr25519',
            }]
        });
        state.type = type.label;
        return (input: MultiStepInput) => this.addKey(input, state);
    }

    async addKey(input: MultiStepInput, state: Partial<AccountInfo>) {
        state.key = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'The key to account',
            placeholder: 'ex. //Alice',
            value: (typeof state.key === 'string') ? state.key : '',
            validate: async (value) => (!value || !value.trim()) ? 'Key is required' : ''
        });
    }
}
