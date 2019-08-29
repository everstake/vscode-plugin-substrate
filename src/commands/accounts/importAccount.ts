import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { AccountsTreeView } from "@/trees";

export class ImportAccountCommand extends BaseCommand {
    async run() {
        const res = await vscode.window.showOpenDialog({
            openLabel: 'Import',
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'Json': ['json'],
            },
        });
        if (!res) {
            console.log('Account wasn\'t added');
            return;
        }
        await this.substrate.importKeyringPair(res[0].path);

        const tree = this.trees.get('accounts') as AccountsTreeView;
        tree.refresh();
    }
}
