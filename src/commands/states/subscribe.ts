import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { StateItem } from "@/trees";

export class SubscribeCommand extends BaseCommand {
    async run(item: StateItem) {
        const state = this.substrate.getState(item.module, item.label);
        if (state === undefined) {
        	vscode.window.showInformationMessage('Can not get chain state');
            return;
        }
        // Todo: Get argument from vscode input
        const data = await state();

        const panel = vscode.window.createWebviewPanel('chainResult', 'Chain state result', vscode.ViewColumn.One);
        panel.webview.html = this.getWebviewContent(item.label, data);
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
                <p>${data}</p>
            </body>
            </html>
        `;
    }
}
