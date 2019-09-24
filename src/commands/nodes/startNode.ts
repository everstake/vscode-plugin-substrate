import * as vscode from 'vscode';

import { BaseCommand } from "@/common";

export class StartNodeCommand extends BaseCommand {
    async run() {
        const terminalName = 'Substrate node';
        let terminal = vscode.window.terminals.find(val => val.name === terminalName);
        if (!terminal) {
            terminal = vscode.window.createTerminal(terminalName);
        }
        terminal.sendText('cargo run -- --dev');
        terminal.show(false);
        await vscode.commands.executeCommand('nodes.refresh');
    }
}
