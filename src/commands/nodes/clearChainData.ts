import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";

export class ClearChainDataCommand extends BaseCommand {
    async run() {
        const terminalName = 'Substrate node';
        let terminal = vscode.window.terminals.find(val => val.name === terminalName);
        if (!terminal) {
            terminal = vscode.window.createTerminal(terminalName);
        }
        terminal.sendText('cargo run -- purge-chain --dev');
        terminal.show(false);
    }
}
