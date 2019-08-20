import * as vscode from 'vscode';
import { KeyringPair } from '@polkadot/keyring/types';

import BaseCommand from "@/common/baseCommand";
import { AccountsTreeView } from "@/trees";
import { MultiStepInput } from '@/common';

type AccountInfo = { name: string, key: string };

export class ImportAccountCommand extends BaseCommand {
    options = {
        title: 'Add account',
        totalSteps: 2,
        ignoreFocusOut: true,
    };

    async run() {
        const tree = this.trees.get('accounts') as AccountsTreeView;

        const state = {} as Partial<AccountInfo>;
        const result = await MultiStepInput.run(input => this.addName(input, state));
        if (!result) {
            console.log('Node wasn\'t added');
            return;
        }
        const value = state as AccountInfo;

        if (this.substrate.isAccountExists(value.key)) {
            vscode.window.showWarningMessage('Account with same key already exists. Account not added');
            return;
        }

        const pair = this.substrate.createKeyringPair(value.key);
        pair.setMeta({ name: value.name });

        const accounts = this.context.globalState.get<KeyringPair[]>('accounts') || [];
        accounts.push(pair);
        this.context.globalState.update('accounts', accounts);

        tree.refresh();
    }

    async addName(input: MultiStepInput, state: Partial<AccountInfo>) {
        state.name = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'Account name',
            placeholder: 'ex. Alice',
            value: (typeof state.name === 'string') ? state.name : '',
            validate: async (value) => (!value || !value.trim()) ? 'Name is required' : ''
        });
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
