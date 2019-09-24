import * as vscode from 'vscode';

import { BaseCommand } from "@/common";

export class StopNodeCommand extends BaseCommand {
    async run() {
        const terminalName = 'Substrate node';
        const terminal = vscode.window.terminals.find(val => val.name === terminalName);
        if (!terminal) {
            return;
        }
        terminal.dispose();
    }
}
