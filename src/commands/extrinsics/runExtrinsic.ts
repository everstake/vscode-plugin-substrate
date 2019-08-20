import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { Extrinsic, ExtrinsicParameter } from "@/trees";

export class RunExtrinsicCommand extends BaseCommand {
    async run(item: Extrinsic) {
        const extrinsic = this.substrate.getExtrinsic(item.module, item.label);
        if (extrinsic === undefined) {
        	vscode.window.showInformationMessage('Not connected to node');
            return;
        }
        const extObj = extrinsic.toJSON();
        const params: ExtrinsicParameter[] = extObj.args;

        const panel = vscode.window.createWebviewPanel(
            'extrinsicResult', // Identifies the type of the webview. Used internally
            'Extrinsic Result', // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the new webview panel in.
            {} // Webview options. More on these later.
        );
        panel.webview.html = this.getWebviewContent();

        // Todo: Use multi imput
        // Todo: Choose account
        // const responses = await this.substrate.getValuesFromInput(params);
        // if (responses.length < params.length) {
        // 	vscode.window.showInformationMessage('Extrinsic execution canceled');
        //     return;
        // }
        // Todo: Sign transaction with choosed account
        // const result = extrinsic(...responses).signAndSend();
        // console.log("TCL: Substrate -> runExtrinsic -> responses", responses);
    }

    getWebviewContent() {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Extrinsic result</title>
        </head>
        <body>
            <h1>Todo: Add extrinsic execution result</h1>
        </body>
        </html>`;
    }
}
