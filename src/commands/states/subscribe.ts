import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { StatesTreeView, StateItem } from "@/trees";

export class SubscribeCommand extends BaseCommand {
    async run(item: StateItem) {
        const tree = this.trees.get('states') as StatesTreeView;

        const panel = vscode.window.createWebviewPanel(
            'extrinsicResult', // Identifies the type of the webview. Used internally
            'Extrinsic Result', // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the new webview panel in.
            {} // Webview options. More on these later.
        );
        panel.webview.html = this.getWebviewContent();

        tree.refresh();
    }

    getWebviewContent() {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Chain state</title>
            </head>
            <body>
                <h1>Todo: Add chain state result</h1>
            </body>
            </html>
        `;
    }
}
