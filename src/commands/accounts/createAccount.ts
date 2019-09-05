import * as vscode from 'vscode';
import { mnemonicGenerate, randomAsU8a } from '@polkadot/util-crypto';
import { KeypairType } from '@polkadot/util-crypto/types';
import { u8aToHex } from '@polkadot/util';

import BaseCommand from "@/common/baseCommand";
import { AccountsTreeView } from "@/trees";
import { MultiStepInput } from '@/common';

type AccountInfo = {
    name: string,
    type: KeypairType,
    keyType: 'seed' | 'mnemonic',
    key: string,
    password: string,
};

export class CreateAccountCommand extends BaseCommand {
    options = {
        title: 'Create account',
        totalSteps: 5,
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

        await this.substrate.createKeyringPairWithPassword(value.key, value.name, value.type, value.password);

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
        if (!type) {
            throw Error('Invalid input');
        }
        state.type = type.label;
        return (input: MultiStepInput) => this.addKeyType(input, state);
    }

    async addKeyType(input: MultiStepInput, state: Partial<AccountInfo>) {
        const type = await input.showQuickPick({
            ...this.options,
            step: input.CurrentStepNumber,
            items: [{
                label: 'Raw seed',
                description: 'seed'
            }, {
                label: 'Mnemonic seed',
                description: 'mnemonic'
            }]
        });
        if (!type) {
            throw Error('Invalid input');
        }
        state.keyType = type.description;
        return (input: MultiStepInput) => this.addKey(input, state);
    }

    async addKey(input: MultiStepInput, state: Partial<AccountInfo>) {
        const placeholder = state.keyType !== 'seed' ?
            'crunch aspect strong flavor enable final display general shy debate stable final'
            : 'ex. 0x89abd2b6b79f4e2df7e89cb6b44c7f02d416719f6970b17d6ad34178423fa922';
        const seed = state.keyType !== 'seed' ?
            mnemonicGenerate()
            : u8aToHex(randomAsU8a());
        state.key = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'The key to account',
            placeholder,
            value: seed,
            validate: async (value) => (!value || !value.trim()) ? 'Key is required' : ''
        });
        return (input: MultiStepInput) => this.addPassword(input, state);
    }

    async addPassword(input: MultiStepInput, state: Partial<AccountInfo>) {
        state.password = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'Account password',
            placeholder: 'ex. StrongPassword',
            password: true,
            value: '',
            validate: async (_) => '',
        });
    }
}
