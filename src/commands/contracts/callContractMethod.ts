import * as vscode from 'vscode';
import { KeyringPair } from '@polkadot/keyring/types';
import { Abi } from '@polkadot/api-contract';

import BaseCommand from "@/common/baseCommand";
import { MultiStepInput } from '@/common';
import { ContractItem } from "@/trees";
import { AccountKey } from '@/substrate';

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
        const state = { abi: item.abi, params: [] } as Partial<CallContractArgs>;
        const argResult = await MultiStepInput.run(input => this.selectContractMethod(input, state));
        if (!argResult) {
            vscode.window.showInformationMessage('Contract method execution canceled');
            return;
        }
        const value = state as CallContractArgs;
        try {
            const con = this.substrate.getConnection();
            if (!con) {
                vscode.window.showErrorMessage('Not connected to a node');
                return;
            }
            const nonce = await con.query.system.accountNonce(value.account.address);
            const contractApi = con.tx.contracts ? con.tx['contracts'] : con.tx['contract'];
            const methodExec = value.abi.messages[value.method];
            const unsignedTransaction = contractApi.call(
                item.description,
                value.value,
                value.max_gas,
                methodExec(...value.params), // Todo: Add abi arguments support
            );

            await unsignedTransaction.sign(value.account, { nonce: nonce as any }).send(({ events = [], status }: any) => {
                if (status.isFinalized) {
                    const finalized = status.asFinalized.toHex();
                    console.log('Completed at block hash', finalized);

                    console.log('Events:');
                    let error: string = '';
                    events.forEach(({ phase, event: { data, method, section } }: any) => {
                        const res = `\t ${phase.toString()} : ${section}.${method} ${data.toString()}`;
                        if (res.indexOf('Failed') !== -1) {
                            error += res;
                        }
                        console.log(res);
                    });
                    if (error !== '') {
                        // Todo: Get error
                        vscode.window.showErrorMessage(`Failed on block "${finalized}" with error: ${error}`);
                        return;
                    }
                    vscode.window.showInformationMessage(`Completed on block ${finalized}`);
                }
            });
        } catch (err) {
            vscode.window.showErrorMessage(`Error on put code: ${err.message}`);
        }
    }

    async selectContractMethod(input: MultiStepInput, state: Partial<CallContractArgs>) {
        const methods = state.abi!.abi.messages;
        const items = methods.map(method => ({
            label: `🧭 ${method.name}(${method.args.join(', ')}): ${method.return_type}`,
            description: method.mutates ? 'will mutate storage' : 'won\'t mutate storage',
            detail: `Method selector: ${method.selector}`,
            method: method.name,
        }));
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
        return (input: MultiStepInput) => this.addAccount(input, state);
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
