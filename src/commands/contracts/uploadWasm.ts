import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { KeyringPair } from '@polkadot/keyring/types';
import { compactAddLength } from '@polkadot/util';

import BaseCommand from "@/common/baseCommand";
import { MultiStepInput } from '@/common';
import { AccountKey } from '@/substrate';

type UploadWasmArgs = {
    account: KeyringPair,
    compiled_contract: Uint8Array,
    code_bundle_name: string,
    contract_abi?: string,
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
            vscode.window.showInformationMessage('WASM upload execution canceled');
            return;
        }
        const value = state as UploadWasmArgs;

        try {
            const con = this.substrate.getConnection();
            if (!con) {
                vscode.window.showErrorMessage('Not connected to a node');
                return;
            }
            const nonce = await con.query.system.accountNonce(value.account.address);
            const contractApi = con.tx.contracts ? con.tx['contracts'] : con.tx['contract'];
            const unsignedTransaction = contractApi.putCode(value.max_gas, value.compiled_contract);

            await unsignedTransaction.sign(value.account, { nonce: nonce as any }).send(({ events = [], status }: any) => {
                if (status.isFinalized) {
                    const finalized = status.asFinalized.toHex();
                    console.log('Completed at block hash', finalized);

                    console.log('Events:');
                    let error: string = '';
                    let resultHash: string = '';
                    events.forEach(({ phase, event: { data, method, section } }: any) => {
                        const res = `\t ${phase.toString()} : ${section}.${method} ${data.toString()}`;
                        if (res.indexOf('Failed') !== -1) {
                            error += res;
                        }
                        if (res.indexOf('contracts.CodeStored') !== -1) {
                            resultHash = res.substring(
                                res.lastIndexOf('["') + 2,
                                res.lastIndexOf('"]'),
                            );
                        }
                        console.log(res);
                    });
                    if (error !== '') {
                        // Todo: Get error
                        vscode.window.showErrorMessage(`Failed on block "${finalized}" with error: ${error}`);
                        return;
                    }
                    if (resultHash === '') {
                        vscode.window.showErrorMessage(`Completed on block "${finalized}" but failed to get event result`);
                        return;
                    }
                    vscode.window.showInformationMessage(`Completed on block ${finalized} with code hash ${resultHash}`);
                    this.substrate.saveContractCode(value.code_bundle_name, resultHash).catch(() => {
                        vscode.window.showErrorMessage(`Failed to store contract`);
                    });
                }
            });
        } catch (err) {
            vscode.window.showErrorMessage(`Error on put code: ${err.message}`);
        }
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
        // Todo: Fix error on cancel
        const codePath = uri[0].fsPath;
        const wasm: Uint8Array = await fs.promises.readFile(codePath);
        const isWasmValid = wasm.subarray(0, 4).join(',') === '0,97,115,109'; // '\0asm'
        if (!isWasmValid) {
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
            placeholder: 'ex. 1000000000000000',
            ignoreFocusOut: true,
            value: (typeof state.max_gas === 'string') ? state.max_gas : '',
            validate: async (value) => {
                if (!value || !value.trim()) {
                    return 'Endowment is required';
                }
                if(!value.match(/^-{0,1}\d+$/)){
                    return 'The maximum gas specified is not a number';
                }
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
