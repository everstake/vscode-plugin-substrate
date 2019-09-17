import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { KeyringPair } from '@polkadot/keyring/types';
import keyringUI from '@polkadot/ui-keyring';
import { compactAddLength } from '@polkadot/util';

import BaseCommand from "@/common/baseCommand";
import { MultiStepInput } from '@/common';
import { AccountKey } from '@/substrate';

type UploadWasmArgs = {
    account: KeyringPair,
    compiled_contract: Uint8Array,
    code_bundle_name: string,
    contract_abi: string,
    max_gas: number,
};

export class UploadWasmCommand extends BaseCommand {
    options = {
        title: 'Upload WASM command',
        totalSteps: 5,
        ignoreFocusOut: true,
    };

    async run() {
        const state = {} as Partial<UploadWasmArgs>;
        const argResult = await MultiStepInput.run(input => this.addCode(input, state));
        if (!argResult) {
            vscode.window.showInformationMessage('Extrinsic execution canceled');
            return;
        }
        const value = state as UploadWasmArgs;

        const conn = this.substrate.getConnection();
        if (!conn) {
            throw Error('Not connected');
        }
        const contractApi = conn.tx.contracts ? conn.tx['contracts'] : conn.tx['contract'];
        const res = await contractApi.putCode(value.max_gas, value.code_bundle_name).signAndSend(value.account);

        // Todo: Subscribe for published code hash
        console.log(res);
    }

    async addCode(input: MultiStepInput, state: Partial<UploadWasmArgs>) {
        const uri = await input.showOpenDialog({
            ...this.options,
            shouldResume: async () => true,
            step: input.CurrentStepNumber,
            openLabel: 'Upload WASM',
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'WebAssembly': ['wasm'],
            },
        });
        if (!uri || uri && uri.length <= 0) {
            throw Error('Code not specified');
        }
        const codePath = uri[0].fsPath;
        const wasm: Uint8Array = fs.readFileSync(codePath);
        const isWasmValid = wasm.subarray(0, 4).toString() === '0,97,115,109'; // '\0asm'
        if (isWasmValid) {
            throw Error('Invalid code');
        }
        state.compiled_contract = compactAddLength(wasm);
        const tmp = path.parse(codePath);
        state.code_bundle_name = tmp.base;
        return (input: MultiStepInput) => this.addCodeBundleName(input, state);
    }

    async addCodeBundleName(input: MultiStepInput, state: Partial<UploadWasmArgs>) {
        state.code_bundle_name = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'A name for the WASM code to help users distinguish',
            placeholder: 'ex. Flipper contract code',
            ignoreFocusOut: true,
            value: (typeof state.code_bundle_name === 'string') ? state.code_bundle_name : '',
            validate: async (value) => (!value || !value.trim()) ? 'Code bundle name is required' : ''
        });
        return (input: MultiStepInput) => this.addMaxGas(input, state);
    }

    async addMaxGas(input: MultiStepInput, state: Partial<UploadWasmArgs>) {
        state.max_gas = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'The maximum amount of gas that can be used by this deployment',
            placeholder: 'ex. 10000',
            ignoreFocusOut: true,
            value: (typeof state.max_gas === 'string') ? state.max_gas : '',
            validate: async (value) => {
                if (!value || !value.trim()) {
                    return 'Maximum gas is required';
                }
                // Todo: Check is it number
                return '';
            },
        });
        return (input: MultiStepInput) => this.addAccount(input, state);
    }

    async addAccount(input: MultiStepInput, state: Partial<UploadWasmArgs>) {
        let items = [] as vscode.QuickPickItem[];
        const accounts = this.substrate.getAcccounts();
        if (!accounts) {
            throw Error('No accounts');
        }
        items = accounts.map(account => ({
            label: account.meta['name'],
            description: account.address,
        }));
        const result = await input.showQuickPick({
            ...this.options,
            step: input.CurrentStepNumber,
            placeholder: 'ex. Alice',
            items,
        });
        const account = accounts.find(account => result.label === account.meta['name']);
        if (!account) {
            throw Error('Account not found');
        }
        return (input: MultiStepInput) => this.addPassword(input, state, account);
    }

    async addPassword(input: MultiStepInput, state: Partial<UploadWasmArgs>, account: AccountKey) {
        const keyring = this.substrate.getKeyring();
        state.account = keyring.addFromJson(account);
        await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'Account password',
            placeholder: 'ex. StrongPassword',
            password: true,
            value: '',
            validate: async (pass) => {
                try {
                    state.account!.decodePkcs8(pass);
                    if (state.account!.isLocked) {
                        return 'Failed to decode account';
                    }
                    return '';
                } catch (err) {
                    return `Failed to decode account: ${err.message}`;
                }
            },
        });
    }
}
