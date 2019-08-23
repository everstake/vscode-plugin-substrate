import * as vscode from 'vscode';
import * as path from 'path';

import BaseCommand from "@/common/baseCommand";
import { Extrinsic, ExtrinsicParameter } from "@/trees";

const loadScript = (context: vscode.ExtensionContext, path: string) => {
    const uri = vscode.Uri.file(context.asAbsolutePath(path)).with({ scheme: 'vscode-resource'}).toString();
    return `<script src="${uri}"></script>`;
};

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
            'extrinsicResult',
            'Extrinsic Result',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [ vscode.Uri.file(path.join(this.context.extensionPath, 'out')) ]
            },
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
                ${loadScript(this.context, 'out/vendor.js')}
                ${loadScript(this.context, 'out/extrinsic.js')}
            </body>
            </html>
        `;
    }
}
