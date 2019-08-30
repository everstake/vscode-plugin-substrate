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
        	await vscode.window.showInformationMessage('Can not get chain state');
            return;
        }
        let argument = undefined;
        const type = (state as any).toJSON().type;
        if (type) {
            const map = type['Map'];
            if (map !== undefined) {
                console.log('Chain state type:', map);
                const state = { type: map.key } as Partial<ChainResult>;
                const result = await MultiStepInput.run(input => this.addArgument(input, state));
                if (!result) {
                    return;
                }
                const value = state as any;
                argument = value.result;
            }
        }

        try {
            const panel = vscode.window.createWebviewPanel('chainResult', 'Chain state result', vscode.ViewColumn.One);
            await state(argument, (data) => {
                panel.webview.html = this.getWebviewContent(item.module, item.label, data.isEmpty ? 'empty' : data);
            });
        } catch (err) {
            await vscode.window.showErrorMessage('Failed with error:', err);
        }
    }

    async addArgument(input: MultiStepInput, state: Partial<ChainResult>) {
        if (state.type === 'AccountId') {
            const placeholder = 'ex. Alice';
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
                placeholder,
                items,
            });
            state.result = result.description;
        } else {
            const placeholder = `Some data with ${state.type} type`;
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

    getWebviewContent(module: string, chain: string, data: any) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Chain state</title>
                <style>
                    textarea {
                        border-radius: 5px;
                        padding: 5px;
                        min-width: 200px;
                        min-height: 50px;
                    }
                    textarea:focus {
                        outline: none;
                    }
                </style>
            </head>
            <body>
                <h1>Result of "${chain}" in module "${module}"</h1>
                <textarea>${data}</textarea>
            </body>
            </html>
        `;
    }
}
