import * as vscode from 'vscode';

import { BaseCommand, log } from "@/common";
import { MultiStepInput } from '@/common';

type AddExistingCodeArgs = {
    code_hash: string,
    code_bundle_name: string,
};

export class AddExistingCodeCommand extends BaseCommand {
    options = {
        title: 'Add existing code command',
        totalSteps: 2,
        ignoreFocusOut: true,
    };

    async run() {
        const state = {} as Partial<AddExistingCodeArgs>;
        const argResult = await MultiStepInput.run(input => this.addCodeHash(input, state));
        if (!argResult) {
            log('Add existing code execution canceled', 'info', true);
            return;
        }
        const value = state as AddExistingCodeArgs;

        try {
            await this.substrate.saveContractCode(value.code_bundle_name, value.code_hash);
            log('Successfully added code hash', 'info', true);
        } catch (err) {
            log(`Failed to store code hash: ${err.message}`, 'error', true);
        }
    }

    async addCodeHash(input: MultiStepInput, state: Partial<AddExistingCodeArgs>) {
        state.code_hash = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'The code hash for the on-chain deployed code',
            placeholder: 'ex. 0xa54a4b44bb0a02b53a59bd47b478dcf1cc451eaee651bebc1bef5fa423b7014b',
            ignoreFocusOut: true,
            value: (typeof state.code_hash === 'string') ? state.code_hash : '',
            validate: async (value) => (!value || !value.trim()) ? 'Code hash is required' : ''
        });
        return (input: MultiStepInput) => this.addCodeBundleName(input, state);
    }

    async addCodeBundleName(input: MultiStepInput, state: Partial<AddExistingCodeArgs>) {
        state.code_bundle_name = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'A name for the WASM code to help users distinguish',
            placeholder: 'ex. Flipper contract code',
            ignoreFocusOut: true,
            value: (typeof state.code_bundle_name === 'string') ? state.code_bundle_name : '',
            validate: async (value) => (!value || !value.trim()) ? 'Code bundle name is required' : ''
        });
    }
}
