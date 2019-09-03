import * as vscode from 'vscode';
import * as path from 'path';
import { SubmittableExtrinsic } from '@polkadot/api/SubmittableExtrinsic';
import { KeyringPair } from '@polkadot/keyring/types';

import BaseCommand from "@/common/baseCommand";
import { Extrinsic, ExtrinsicParameter } from "@/trees";
import { MultiStepInput, MultiStepInputCallback, InputFlowAction } from '@/common';
import { AccountKey } from '@/substrate';

type ExtrinsicArgs = {
    account: KeyringPair,
    args: { [key: string]: string },
    params: ExtrinsicParameter[],
};

export class RunExtrinsicCommand extends BaseCommand {
    options = {
        title: 'Run extrinsic command',
        totalSteps: 1,
        ignoreFocusOut: true,
    };

    async run(item: Extrinsic) {
        const extrinsic = this.substrate.getExtrinsic(item.module, item.label);
        if (extrinsic === undefined) {
        	await vscode.window.showInformationMessage('Not connected to node');
            return;
        }
        const extObj = extrinsic.toJSON();
        const params: ExtrinsicParameter[] = extObj.args;

        this.options.totalSteps = params.length + 2;
        const state = { params, args: {} } as Partial<ExtrinsicArgs>;
        const argResult = await MultiStepInput.run(input => this.nextArgument(input, state));
        if (!argResult) {
            await vscode.window.showInformationMessage('Extrinsic execution canceled');
            return;
        }
        const value = state as ExtrinsicArgs;
        if (value.account.isLocked) {
            await vscode.window.showErrorMessage('Canceling extrinsic execution due to KeyringPair decode error');
            return;
        }

        try {
            const con = this.substrate.getConnection();
            if (!con) {
                await vscode.window.showErrorMessage('Not connected to a node');
                return;
            }
            const nonce = await con.query.system.accountNonce(value.account.address);
            const unsignedTransaction: SubmittableExtrinsic<'promise'> = extrinsic(...Object.values(value.args));

            await unsignedTransaction.sign(value.account, { nonce: nonce.toString() }).send(({ events = [], status }) => {
                if (status.isFinalized) {
                    const finalized = status.asFinalized.toHex();
                    console.log('Completed at block hash', finalized);

                    console.log('Events:');
                    let error: string = '';
                    events.forEach(({ phase, event: { data, method, section } }) => {
                        const res = `\t ${phase.toString()} : ${section}.${method} ${data.toString()}`;
                        if (res.indexOf('Failed') !== -1) {
                            error += res;
                        }
                        console.log(res);
                    });

                    if (error !== '') {
                        // Todo: Get error
                        vscode.window.showErrorMessage(`Failed on block "${finalized}" with error: ${error}`);
                    } else {
                        vscode.window.showInformationMessage(`Completed at block hash: ${finalized}`);
                    }
                }
            });
        } catch (err) {
            await vscode.window.showErrorMessage(`Error on extrinsic: ${err.message}`);
        }
    }

    async nextArgument(input: MultiStepInput, state: Partial<ExtrinsicArgs>) {
        const currentStep = input.CurrentStepNumber - 1;
        const param = state.params![currentStep];
        let callback: MultiStepInputCallback = (input: MultiStepInput) => this.nextArgument(input, state);

        if (param.type === 'AccountId') {
            let items = [] as vscode.QuickPickItem[];
            const accounts = this.substrate.getAcccounts();
            if (!accounts) {
                throw new Error('No accounts');
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
            state.args![param.name as any] = result.description;
        } else {
            await this.textInput(input, state, param);
        }

        if (currentStep === state.params!.length - 1) {
            callback = (input: MultiStepInput) => this.addAccount(input, state);
        }
        return callback;
    }

    async textInput(input: MultiStepInput, state: Partial<ExtrinsicArgs>, param: ExtrinsicParameter) {
        const prompt = `${param.name}: ${param.type}`;
        const val = state.args![input.CurrentStepNumber - 1];
        const result = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt,
            placeholder: 'ex. Some data',
            value: (typeof val === 'string') ? val : '',
            validate: async (value) => !value || !value.trim() ? `${param.name} is required` : '',
            // Todo: Add button logic
            buttons: [{
                iconPath: path.join(__filename, '..', '..', '..', 'assets', 'dark', 'file.svg'),
                tooltip: 'Open from file',
            }],
        });
        // Result of click on new button here
        state.args![param.name as any] = result;
    }

    async addAccount(input: MultiStepInput, state: Partial<ExtrinsicArgs>) {
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

    async addPassword(input: MultiStepInput, state: Partial<ExtrinsicArgs>, account: AccountKey) {
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
