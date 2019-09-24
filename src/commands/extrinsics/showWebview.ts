import * as vscode from 'vscode';
import * as path from 'path';

import { BaseCommand } from "@/common";

const loadScript = (context: vscode.ExtensionContext, path: string) => {
    const uri = vscode.Uri.file(context.asAbsolutePath(path)).with({ scheme: 'vscode-resource'}).toString();
    return `<script src="${uri}"></script>`;
};

export class ShowWebviewCommand extends BaseCommand {
    async run() {
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
        panel.webview.html = this.getWebviewContent({ data: 'value' });
    }

    getWebviewContent(result: any) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Extrinsic result</title>
                <script>
                    window.data = ${JSON.stringify(result)};
                </script>
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
