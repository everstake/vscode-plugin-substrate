import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { AccountsTreeView, AccountItem } from "@/trees";
import { MultiStepInput } from '@/common';

type AccountInfo = { name: string };

export class RenameAccountCommand extends BaseCommand {
    options = {
        title: 'Rename account',
        totalSteps: 1,
        ignoreFocusOut: false,
    };

    async run(item: AccountItem) {
        const state = {} as Partial<AccountInfo>;
        const result = await MultiStepInput.run(input => this.addName(input, state));
        if (!result) {
            console.log('Account name wasn\'t changed');
            return;
        }
        const value = state as AccountInfo;

        this.substrate.alterNameOfKeyringPair(item.label, value.name);

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
    }
}
