import * as vscode from 'vscode';
import * as fs from 'fs';
import { KeyringPair$Json } from '@polkadot/keyring/types';
import keyringUI from '@polkadot/ui-keyring';
import { Keyring } from '@polkadot/keyring';
import { compactAddLength } from '@polkadot/util';

import BaseCommand from "@/common/baseCommand";
import { MultiStepInput } from '@/common';

type UploadWasmArgs = {
    account: KeyringPair$Json,
    code: string,
    contract_name: string,
    endowment: string,
    max_gas: number,
};

interface LoadEvent {
  target: {
    result: ArrayBuffer;
  };
}

export class UploadWasmCommand extends BaseCommand {
    options = {
        title: 'Run extrinsic command',
        totalSteps: 2,
        ignoreFocusOut: true,
    };

    async run() {
        const state = {} as Partial<UploadWasmArgs>;
        const argResult = await MultiStepInput.run(input => this.addAccount(input, state));
        if (!argResult) {
            vscode.window.showInformationMessage('Extrinsic execution canceled');
            return;
        }
        const value = state as UploadWasmArgs;
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
        state.account = account;
        return (input: MultiStepInput) => this.addCode(input, state);
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
        const codePath = uri[0].path;

        const wasm: Uint8Array = fs.readFileSync(codePath);
        const isWasmValid = wasm.subarray(0, 4).toString() === '0,97,115,109'; // '\0asm'
        if (isWasmValid) {
            throw Error('Invalid code');
        }
        const result = compactAddLength(wasm);

        const conn = this.substrate.getConnection();
        if (!conn) {
            throw Error('Not connected');
        }
        const contractApi = conn.tx.contracts ? conn.tx['contracts'] : conn.tx['contract'];
        // Todo: Get decoded account
        const keyring = new Keyring({ type: 'sr25519' });
        const acc = keyring.addFromJson(state.account!);
        acc.decodePkcs8('');
        const res = await contractApi.putCode('10000000', result).signAndSend(acc);
        // Todo: Subscribe for published code hash
        console.log(res);

        // keyring.saveContract()
        // return (input: MultiStepInput) => this.addPassword(input, state, account);
    }
}
