import * as vscode from 'vscode';
import { KeyringPair } from '@polkadot/keyring/types';

import { MultiStepInput, MultiStepInputCallback, BaseCommand, log } from "@/common";
import { Extrinsic, ExtrinsicParameter } from "@/trees";
import { AccountKey } from '@/substrate';

type ExtrinsicArgs = {
    account: KeyringPair,
    args: { [key: string]: string },
    params: ExtrinsicParameter[],
};

export class RunExtrinsicCommand extends BaseCommand {
    options = {
        title: 'Run extrinsic command',
        ignoreFocusOut: true,
    };

    async run(item: Extrinsic) {
        const extrinsic = this.substrate.getExtrinsic(item.module, item.label);
        if (extrinsic === undefined) {
            log('Not connected to node', 'warn', true);
            return;
        }
        const extObj = extrinsic.toJSON();
        const params: ExtrinsicParameter[] = extObj.args;

        const state = { params, args: {} } as Partial<ExtrinsicArgs>;
        const argResult = await MultiStepInput.run(input => this.nextArgument(input, state));
        if (!argResult) {
            log('Extrinsic execution canceled', 'info', true);
            return;
        }
        const value = state as ExtrinsicArgs;
        if (value.account.isLocked) {
            log('Canceling extrinsic execution due to KeyringPair decode error', 'warn', true);
            return;
        }

        try {
            const con = this.substrate.getConnection();
            if (!con) {
                log('Not connected to a node', 'error', true);
                return;
            }
            const nonce = await con.query.system.accountNonce(value.account.address);
            const unsignedTransaction = extrinsic(...Object.values(value.args));

            con.on('error', (args) => {
                log(`Failed to execute extrinsic with args: ${args}`, 'error', false);
            });

            await unsignedTransaction.sign(value.account, { nonce: nonce as any }).send(({ events = [], status }: any) => {
                if (status.isFinalized) {
                    const finalized = status.asFinalized.toHex();
                    log(`Completed at block hash: ${finalized}`, 'info', false);

                    log('Events:', 'info', false);
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
                    } else {
                        log(`Completed at block hash: ${finalized}`, 'info', true);
                    }
                }
            });
        } catch (err) {
            log(`Error on extrinsic: ${err.message}`, 'error', false);
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
        // Todo: Add parse result of click on the button here
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
