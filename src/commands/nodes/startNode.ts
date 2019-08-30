import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { NodesTreeView } from "@/trees";

export class StartNodeCommand extends BaseCommand {
    async run() {
        // const folders = vscode.workspace.workspaceFolders;
        // if (!folders) {
        //     await vscode.window.showErrorMessage("Can not get workspace folder path");
        //     return;
        // }
        // const path: string = folders[0].uri.fsPath;
        const terminalName = 'Substrate node';
        let terminal = vscode.window.terminals.find(val => val.name === terminalName);
        if (!terminal) {
            terminal = vscode.window.createTerminal(terminalName);
        }
        terminal.sendText('cargo run -- --dev');
        terminal.show(false);

        const tree = this.trees.get('nodes') as NodesTreeView;
        tree.refresh();
    }
}
