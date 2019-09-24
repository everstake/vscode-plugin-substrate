import * as vscode from 'vscode';
import * as fs from 'fs';
import { Abi } from '@polkadot/api-contract';
import { KeyringPair } from '@polkadot/keyring/types';

import { BaseCommand, log } from "@/common";
import { MultiStepInput } from '@/common';
import { AccountKey } from '@/substrate';
import { ContractABIArg } from '@polkadot/api-contract/types';

type DeployContractArgs = {
    account: KeyringPair,
    code: { name: string, hash: string },
    contract_name: string,
    contract_abi: Abi,
    endowment: string,
    max_gas: string,
    params: { [key: string]: string },
};

export class DeployContractCommand extends BaseCommand {
    options = {
        title: 'Deploy contract command',
        ignoreFocusOut: true,
    };

    async run() {
        const state = { params: {} } as Partial<DeployContractArgs>;
        const argResult = await MultiStepInput.run(input => this.addCodeHash(input, state));
        if (!argResult) {
            log('Deploy contract execution canceled', 'info', true);
            return;
        }
        const value = state as DeployContractArgs;

        try {
            const con = this.substrate.getConnection();
            if (!con) {
                log('Not connected to a node', 'error', true);
                return;
            }
            const nonce = await con.query.system.accountNonce(value.account.address);
            const contractApi = con.tx.contracts ? con.tx['contracts'] : con.tx['contract'];
            const unsignedTransaction = contractApi.create(
                value.endowment,
                value.max_gas,
                value.code.hash,
                value.contract_abi.deploy(...Object.values(value.params)),
            );

            await unsignedTransaction.sign(value.account, { nonce: nonce as any }).send(({ events = [], status }: any) => {
                if (status.isFinalized) {
                    const finalized = status.asFinalized.toHex();
                    log(`Completed at block hash: ${finalized}`, 'info', false);

                    log('Events:', 'info', false);
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
                        log(res, 'info', false);
                    });
                    if (error !== '') {
                        // Todo: Get error
                        log(`Failed on block "${finalized}" with error: ${error}`, 'error', true);
                        return;
                    }
                    if (resultHash === '') {
                        log(`Completed on block "${finalized}" but failed to get event result`, 'info', true);
                        return;
                    }
                    this.substrate.saveContract(value.contract_name, resultHash, value.contract_abi).catch(err => {
                        log(`Failed to store contract: ${err.message}`, 'error', true);
                    });
                    log(`Completed on block ${finalized} with code hash ${resultHash}`, 'info', true);
                }
            });
        } catch (err) {
            log(`Error on deploy ccontract: ${err.message}`, 'error', true);
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

        return (input: MultiStepInput) => this.nextArgument(input, state);
    }

    async nextArgument(input: MultiStepInput, state: Partial<DeployContractArgs>): Promise<any> {
        const stepsPassed = 3;
        const currentStep = input.CurrentStepNumber - stepsPassed;
        const args = state.contract_abi!.abi.deploy.args;
        const arg = args[currentStep - 1];
        // Todo: Add support of all types
        await this.textInput(input, state, currentStep, arg);
        if (currentStep >= args.length) {
            return (input: MultiStepInput) => this.addEndowment(input, state);
        }
        return (input: MultiStepInput) => this.nextArgument(input, state);
    }

    async textInput(input: MultiStepInput, state: Partial<DeployContractArgs>, currentStep: number, param: ContractABIArg) {
        const prompt = `${param.name}: ${param.type}`;
        const val = state.params![currentStep - 1];
        // const button = {
        //     iconPath: assets(this.context, 'dark', 'file.svg'),
        //     tooltip: 'Open from file',
        // };
        const result = await input.showInputBox({
            ...this.options,
            prompt,
            placeholder: 'ex. Some data',
            value: (typeof val === 'string') ? val : '',
            validate: async (value) => !value || !value.trim() ? `${param.name} is required` : '',
            // buttons: [button],
        });
        // Result of click on new button here
        state.params![currentStep - 1] = result;
    }

    async addEndowment(input: MultiStepInput, state: Partial<DeployContractArgs>) {
        state.endowment = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'The allotted endowment for this contract, i.e. the amount transferred to the contract upon instantiation',
            placeholder: 'ex. 1000000000000000',
            ignoreFocusOut: true,
            value: (typeof state.endowment === 'string') ? state.endowment : '',
            validate: async (value) => {
                if (!value || !value.trim()) {
                    return 'Endowment is required';
                }
                if(!value.match(/^-{0,1}\d+$/)){
                    return 'The endowment specified is not a number';
                }
                return '';
            },
        });
        return (input: MultiStepInput) => this.addMaxGas(input, state);
    }

    async addMaxGas(input: MultiStepInput, state: Partial<DeployContractArgs>) {
        state.max_gas = await input.showInputBox({
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
                if(!value.match(/^-{0,1}\d+$/)){
                    return 'The maximum gas specified is not a number';
                }
                return '';
            },
        });
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
