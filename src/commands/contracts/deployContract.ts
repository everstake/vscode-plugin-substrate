import * as vscode from 'vscode';
import * as fs from 'fs';
import { Abi } from '@polkadot/api-contract';
import { KeyringPair } from '@polkadot/keyring/types';

import BaseCommand from "@/common/baseCommand";
import { MultiStepInput } from '@/common';
import { AccountKey } from '@/substrate';

type DeployContractArgs = {
    account: KeyringPair,
    code: { name: string, hash: string },
    contract_name: string,
    contract_abi: Abi,
    endowment: number,
    max_gas: number,
};

export class DeployContractCommand extends BaseCommand {
    options = {
        title: 'Deploy contract command',
        totalSteps: 7,
        ignoreFocusOut: true,
    };

    async run() {
        const state = {} as Partial<DeployContractArgs>;
        const argResult = await MultiStepInput.run(input => this.addCodeHash(input, state));
        // const argResult = await MultiStepInput.run(input => this.addContractAbi(input, state));
        if (!argResult) {
            vscode.window.showInformationMessage('Extrinsic execution canceled');
            return;
        }
        const value = state as DeployContractArgs;

        try {
            const con = this.substrate.getConnection();
            if (!con) {
                vscode.window.showErrorMessage('Not connected to a node');
                return;
            }
            const nonce = await con.query.system.accountNonce(value.account.address);
            const contractApi = con.tx.contracts ? con.tx['contracts'] : con.tx['contract'];
            const unsignedTransaction = contractApi.create(
                value.endowment,
                value.max_gas,
                value.code.hash,
                value.contract_abi.deploy(), // Todo: Add abi arguments support
            );

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
                        if (res.indexOf('indices.NewAccountIndex') !== -1) {
                            resultHash = res.substring(
                                res.lastIndexOf('["') + 2,
                                res.lastIndexOf('",'),
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
                        vscode.window.showWarningMessage(`Completed on block "${finalized}" but failed to get event result`);
                        return;
                    }
                    vscode.window.showInformationMessage(`Completed on block ${finalized} with code hash ${resultHash}`);
                    this.substrate.saveContract(value.code.name, value.contract_name, resultHash).catch(() => {
                        vscode.window.showErrorMessage(`Failed to store contract`);
                    });
                }
            });
        } catch (err) {
            vscode.window.showErrorMessage(`Error on put code: ${err.message}`);
        }
    }

    async addCodeHash(input: MultiStepInput, state: Partial<DeployContractArgs>) {
        const codes = this.substrate.getConnectionContractCodes();
        const items = codes.map(code => ({
            label: code.name,
            description: code.hash,
        }));
        const code = await input.showQuickPick({
            ...this.options,
            step: input.CurrentStepNumber,
            placeholder: 'ex. flipper-prunned.wasm (0xa54a4b44bb0a02b53a59bd47b478dcf1cc451eaee651bebc1bef5fa423b7014b)',
            ignoreFocusOut: true,
            items,
        });
        state.code = {
            name: code.label,
            hash: code.description,
        };
        state.contract_name = `${code.label} (instance)`;
        return (input: MultiStepInput) => this.addContractName(input, state);
    }

    async addContractName(input: MultiStepInput, state: Partial<DeployContractArgs>) {
        state.contract_name = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'The name for the deployed contract to help users distinguish',
            placeholder: 'ex. Best contract ever',
            ignoreFocusOut: true,
            value: (typeof state.contract_name === 'string') ? state.contract_name : '',
            validate: async (value) => {
                if (!value || !value.trim()) {
                    return 'Maximum gas is required';
                }
                return '';
            },
        });
        return (input: MultiStepInput) => this.addContractAbi(input, state);
    }

    async addContractAbi(input: MultiStepInput, state: Partial<DeployContractArgs>) {
        const uri = await input.showOpenDialog({
            ...this.options,
            shouldResume: async () => true,
            step: input.CurrentStepNumber,
            openLabel: 'Choose ABI',
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'JSON': ['json'],
            },
        });
        if (!uri || uri && uri.length <= 0) {
            throw Error('Abi not specified');
        }
        const codePath = uri[0].fsPath;
        const abiBytes: Uint8Array = await fs.promises.readFile(codePath);
        const abiJson = JSON.parse(abiBytes.toString());
        const abi = new Abi(abiJson);

        state.contract_abi = abi;

        // Todo: Update total steps based on abi deploy arguments. Add inputs for every argument

        return (input: MultiStepInput) => this.addEndowment(input, state);
        // return (input: MultiStepInput) => this.addAccount(input, state);
    }

    async addEndowment(input: MultiStepInput, state: Partial<DeployContractArgs>) {
        const val = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'The allotted endowment for this contract, i.e. the amount transferred to the contract upon instantiation',
            placeholder: 'ex. 10000',
            ignoreFocusOut: true,
            value: (typeof state.max_gas === 'string') ? state.max_gas : '',
            validate: async (value) => {
                if (!value || !value.trim()) {
                    return 'Endowment is required';
                }
                const num = Number.parseInt(value, 10);
                const isNan = Number.isNaN(num);
                if (isNan) {
                    return 'The endowment specified was not a number';
                }
                return '';
            },
            convert: async (value) => Number.parseInt(value),
        });
        state.endowment = Number.parseInt(val, 10);
        return (input: MultiStepInput) => this.addMaxGas(input, state);
    }

    async addMaxGas(input: MultiStepInput, state: Partial<DeployContractArgs>) {
        const val = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'The maximum amount of gas that can be used by this deployment',
            placeholder: 'ex. 500000',
            ignoreFocusOut: true,
            value: (typeof state.max_gas === 'string') ? state.max_gas : '',
            validate: async (value) => {
                if (!value || !value.trim()) {
                    return 'Maximum gas is required';
                }
                const num = Number.parseInt(value, 10);
                const isNan = Number.isNaN(num);
                if (isNan) {
                    return 'The maximum gas specified was not a number';
                }
                return '';
            },
            convert: async (value) => Number.parseInt(value),
        });
        state.max_gas = Number.parseInt(val, 10);
        return (input: MultiStepInput) => this.addAccount(input, state);
    }

    async addAccount(input: MultiStepInput, state: Partial<DeployContractArgs>) {
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

    async addPassword(input: MultiStepInput, state: Partial<DeployContractArgs>, account: AccountKey) {
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
