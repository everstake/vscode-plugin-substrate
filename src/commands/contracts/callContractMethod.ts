import * as vscode from 'vscode';
import { KeyringPair } from '@polkadot/keyring/types';
import { Abi } from '@polkadot/api-contract';

import { BaseCommand, log } from "@/common";
import { MultiStepInput } from '@/common';
import { ContractItem } from "@/trees";
import { AccountKey } from '@/substrate';
import { ContractABIMethod, ContractABIArg } from '@polkadot/api-contract/types';

type CallContractArgs = {
    abi: Abi,
    method: string,
    value: string,
    max_gas: string,
    params: any[],
    account: KeyringPair,
};

export class CallContractMethodCommand extends BaseCommand {
    options = {
        title: 'Call contract method',
        ignoreFocusOut: true,
    };

    async run(item: ContractItem) {
        const state = { abi: item.abi, value: '0', params: [] } as Partial<CallContractArgs>;
        const argResult = await MultiStepInput.run(input => this.selectContractMethod(input, state));
        if (!argResult) {
            log('Contract method execution canceled', 'info', true);
            return;
        }
        const value = state as CallContractArgs;
        try {
            const con = this.substrate.getConnection();
            if (!con) {
                log('Not connected to a node', 'error', true);
                return;
            }
            const nonce = await con.query.system.accountNonce(value.account.address);
            const contractApi = con.tx.contracts ? con.tx['contracts'] : con.tx['contract'];
            const methodExec = value.abi.messages[value.method];
            const unsignedTransaction = contractApi.call(
                item.description,
                value.value,
                value.max_gas,
                methodExec(...value.params),
            );

            await unsignedTransaction.sign(value.account, { nonce: nonce as any }).send(({ events = [], status }: any) => {
                if (status.isFinalized) {
                    const finalized = status.asFinalized.toHex();
                    log(`Completed at block hash: ${finalized}`, 'info', false);

                    log(`Events:`, 'info', false);
                    let error: string = '';
                    events.forEach(({ phase, event: { data, method, section } }: any) => {
                        const res = `\t ${phase.toString()} : ${section}.${method} ${data.toString()}`;
                        if (res.indexOf('Failed') !== -1) {
                            error += res;
                        }
                        log(res, 'info', false);
                    });
                    if (error !== '') {
                        // Todo: Get error
                        log(`Failed on block "${finalized}" with error: ${error}`, 'error', true);
                        return;
                    }
                    log(`Completed on block ${finalized}`, 'info', true);
                }
            });
        } catch (err) {
            log(`Error on put code: ${err.message}`, 'error', true);
        }
    }

    async selectContractMethod(input: MultiStepInput, state: Partial<CallContractArgs>) {
        const methods = state.abi!.abi.messages;
        const items = methods.map(method => {
            const args = method.args.map((arg: ContractABIArg) => `${arg.name}: ${arg.type}`);
            return {
                label: `🧭 ${method.name}(${args.join(', ')}): ${method.return_type}`,
                description: method.mutates ? 'will mutate storage' : 'won\'t mutate storage',
                detail: `Method selector: ${method.selector}`,
                method: method.name,
            };
        });
        const res = await input.showQuickPick({
            ...this.options,
            placeholder: 'ex. get(): bool',
            items,
        });
        state.method = res.method;
        return (input: MultiStepInput) => this.addValue(input, state);
    }

    async addValue(input: MultiStepInput, state: Partial<CallContractArgs>) {
        state.value = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'The allotted value for this contract, i.e. the amount transferred to the contract as part of this call',
            placeholder: 'ex. 1000000000000',
            ignoreFocusOut: true,
            value: (typeof state.value === 'string') ? state.value : '',
            validate: async (value) => {
                if (!value || !value.trim()) {
                    return 'Value is required';
                }
                if(!value.match(/^-{0,1}\d+$/)){
                    return 'The value specified is not a number';
                }
                return '';
            },
        });
        return (input: MultiStepInput) => this.addMaxGas(input, state);
    }

    async addMaxGas(input: MultiStepInput, state: Partial<CallContractArgs>) {
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
        const method = state.abi!.abi.messages.find((msg: ContractABIMethod) => msg.name === state.method);
        if (!method) {
            throw Error(`Invalid argument. Cannot continue with arguments of contract method`);
        }
        if (method.args.length <= 0) {
            return (input: MultiStepInput) => this.addAccount(input, state);
        }
        return (input: MultiStepInput) => this.nextArgument(input, state);
    }

    async nextArgument(input: MultiStepInput, state: Partial<CallContractArgs>): Promise<any> {
        const stepsPassed = 3;
        const currentStep = input.CurrentStepNumber - stepsPassed;
        const method = state.abi!.abi.messages.find((msg: ContractABIMethod) => msg.name === state.method);
        if (!method) {
            throw Error(`Invalid argument. Cannot continue with arguments of contract method`);
        }
        const arg = method.args[currentStep - 1];
        // Todo: Add support of all types
        await this.textInput(input, state, currentStep, arg);
        if (currentStep >= method.args.length) {
            return (input: MultiStepInput) => this.addAccount(input, state);
        }
        return (input: MultiStepInput) => this.nextArgument(input, state);
    }

    async textInput(input: MultiStepInput, state: Partial<CallContractArgs>, currentStep: number, param: ContractABIArg) {
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
        // Result of click on button here
        state.params![currentStep - 1] = result;
    }

    async addAccount(input: MultiStepInput, state: Partial<CallContractArgs>) {
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

    async addPassword(input: MultiStepInput, state: Partial<CallContractArgs>, account: AccountKey) {
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
