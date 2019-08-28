import * as vscode from 'vscode';
// import * as path from 'path';
import { SubmittableExtrinsic } from '@polkadot/api/SubmittableExtrinsic';
import { KeyringPair } from '@polkadot/keyring/types';

import BaseCommand from "@/common/baseCommand";
import { Extrinsic, ExtrinsicParameter } from "@/trees";
import { MultiStepInput, MultiStepInputCallback } from '@/common';
import Keyring from '@polkadot/keyring';

type ExtrinsicArgs = {
    account: KeyringPair,
    args: string[],
    params: ExtrinsicParameter[],
};

const loadScript = (context: vscode.ExtensionContext, path: string) => {
    const uri = vscode.Uri.file(context.asAbsolutePath(path)).with({ scheme: 'vscode-resource'}).toString();
    return `<script src="${uri}"></script>`;
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
        	vscode.window.showInformationMessage('Not connected to node');
            return;
        }
        const extObj = extrinsic.toJSON();
        const params: ExtrinsicParameter[] = extObj.args;

        this.options.totalSteps = params.length + 1;
        const state = { params, args: [] } as Partial<ExtrinsicArgs>;
        const argResult = await MultiStepInput.run(input => this.nextArgument(input, state));
        if (!argResult) {
            return;
        }
        const value = state as ExtrinsicArgs;

        try {
            const con = this.substrate.getConnection();
            if (!con) {
                vscode.window.showErrorMessage('Not connected to a node');
                return;
            }
            const nonce = await con.query.system.accountNonce(value.account.address);
            const unsignedTransaction: SubmittableExtrinsic<'promise'> = extrinsic(...value.args);

            // Todo: Get result
            unsignedTransaction.sign(value.account, { nonce: nonce.toString() }).send(({ events = [], status }) => {
                if (status.isFinalized) {
                    console.log('Completed at block hash', status.asFinalized.toHex());
                    console.log('Events:');

                    events.forEach(({ phase, event: { data, method, section } }) => {
                        console.log('\t', phase.toString(), `: ${section}.${method}`, data.toString());
                    });

                    vscode.window.showInformationMessage(`Result`);
                }
            });
        } catch (err) {
            console.log(`Error on extrinsic: ${err}`);
        }
        // const panel = vscode.window.createWebviewPanel(
        //     'extrinsicResult',
        //     'Extrinsic Result',
        //     vscode.ViewColumn.One,
        //     {
        //         enableScripts: true,
        //         retainContextWhenHidden: true,
        //         localResourceRoots: [ vscode.Uri.file(path.join(this.context.extensionPath, 'out')) ]
        //     },
        // );
        // panel.webview.html = this.getWebviewContent(result);
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
            state.args!.push(result.description);
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
        });
        state.args!.push(result);
    }

    async addAccount(input: MultiStepInput, state: Partial<ExtrinsicArgs>) {
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
        const account = accounts.find(account => result.label === account.meta['name']);
        if (!account) {
            vscode.window.showErrorMessage('Account not found');
            return;
        }
        return (input: MultiStepInput) => this.addPassword(input, state, account);
    }

    async addPassword(input: MultiStepInput, state: Partial<ExtrinsicArgs>, account: KeyringPair) {
        const keyring = this.substrate.getKeyring();
        const password = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'Account password',
            placeholder: 'ex. StrongPassword',
            password: true,
            value: '',
            validate: async (_) => '',
        });

        try {
            state.account = keyring.addFromAddress(account.address, account.meta);
            // Todo: Unlock KeyringPair
            // if (account.isLocked) {}
            state.account.decodePkcs8(password);
        } catch (err) {
            console.log("TCL: addPassword -> err", err);
        }
        console.log("TCL: addPassword -> password", password);
    }

    getWebviewContent(result: any) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Extrinsic result</title>
            </head>
            <body>
                <div id="root"></div>
                <div>
                    <p>${result}</p>
                </div>
                ${loadScript(this.context, 'out/vendor.js')}
                ${loadScript(this.context, 'out/extrinsic.js')}
            </body>
            </html>
        `;
    }
}
