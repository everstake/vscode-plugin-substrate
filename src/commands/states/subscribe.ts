import * as vscode from 'vscode';
import { KeyringPair } from '@polkadot/keyring/types';

import BaseCommand from "@/common/baseCommand";
import { StateItem } from "@/trees";
import { MultiStepInput } from "@/common";

type ChainResult = { type: string, result: string };

export class SubscribeCommand extends BaseCommand {
    options = {
        title: 'Chain state arguments',
        totalSteps: 1,
        ignoreFocusOut: true,
    };

    async run(item: StateItem) {
        const state = this.substrate.getState(item.module, item.label);
        if (state === undefined) {
        	vscode.window.showInformationMessage('Can not get chain state');
            return;
        }
        const type = (state as any).toJSON().type;
        const map = type['Map'];
        const args = [];
        if (map !== undefined) {
            const state = { type: map.key } as Partial<ChainResult>;
            const result = await MultiStepInput.run(input => this.addArgument(input, state));
            if (!result) {
                return;
            }
            const value = state as any;
            args.push(value.result);
        }
        const data = await state(...args);

        const panel = vscode.window.createWebviewPanel('chainResult', 'Chain state result', vscode.ViewColumn.One);
        panel.webview.html = this.getWebviewContent(item.label, data);
    }

    async addArgument(input: MultiStepInput, state: Partial<ChainResult>) {
        if (state.type === 'AccountId') {
            const placeholder = 'ex. Alice';
            let items = [] as vscode.QuickPickItem[];
            const accounts = this.context.globalState.get<KeyringPair[]>('accounts');
            if (accounts) {
                items = accounts.map(account => ({
                    label: account.meta['name'],
                    description: account.address,
                }));
            }
            const result = await input.showQuickPick({
                ...this.options,
                step: input.CurrentStepNumber,
                placeholder,
                items,
            });
            state.result = result.description;
        } else {
            const placeholder = `Some data with ${state.result} type`;
            state.result = await input.showInputBox({
                ...this.options,
                step: input.CurrentStepNumber,
                prompt: 'Chain state argument',
                placeholder,
                value: (typeof state.result === 'string') ? state.result : '',
                validate: async (value) => !value || !value.trim() ? 'Name is required' : '',
            });
        }
    }

    getWebviewContent(chain: string, data: any) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Chain state</title>
            </head>
            <body>
                <h1>Result of ${chain}</h1>
                <span>${data}</span>
            </body>
            </html>
        `;
    }
}
