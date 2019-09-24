import * as vscode from 'vscode';

import { BaseCommand, log } from "@/common";

export class ImportAccountCommand extends BaseCommand {
    async run() {
        const res = await vscode.window.showOpenDialog({
            openLabel: 'Import',
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'JSON': ['json'],
            },
        });
        if (!res) {
            log('Account wasn\'t added', 'info', true);
            return;
        }
        await this.substrate.importKeyringPair(res[0].path);
        await vscode.commands.executeCommand('nodes.refresh');
    }
}
