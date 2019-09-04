import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
// import { getTypeRegistry } from "@polkadot/types";

import BaseCommand from "@/common/baseCommand";

export class EditTypesCommand extends BaseCommand {
    // private subscriptions: vscode.Disposable | undefined;

    async run() {
        const globalPath = this.context.globalStoragePath;
        const filePath = path.join(globalPath, 'types.json');

        try {
            await this.openTypes(filePath);
        } catch (error) {
            try {
                await fs.promises.mkdir(globalPath, { recursive: true });
            } catch (error) {}
            await fs.promises.writeFile(filePath, '{}\n', 'utf8');
            const tmp = this.openTypes(filePath).catch(async () => {
                console.log('Failed to open types');
                vscode.window.showErrorMessage('Failed to open types');
            });
            await tmp;
        }
    }

    async openTypes(path: string) {
        const doc = await vscode.workspace.openTextDocument(path);
        /*const editor = */vscode.window.showTextDocument(doc);

        // Todo: Add checks for types
        // const registry = getTypeRegistry();
        // registry.register();

        // this.subscriptions = vscode.workspace.onDidChangeTextDocument((event) => {
        //     const text = editor.document.getText();
        //     try {
        //         const types = JSON.parse(text);
        //         console.log(types);
        //     } catch (err) {
        //         console.log('Invalid JSON');
        //     }
        // });
    }
}
