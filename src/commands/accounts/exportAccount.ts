import * as vscode from 'vscode';
import * as fs from 'fs';

import { BaseCommand, log } from "@/common";
import { AccountItem } from "@/trees";

export class ExportAccountCommand extends BaseCommand {
    async run(item: AccountItem) {
        const accounts = this.substrate.getAcccounts();
        const account = accounts.find(account => account.meta['name'] === item.label);
        if (!account) {
            log('Account not found', 'info', false);
            return;
        }
        const result = await vscode.window.showSaveDialog({});
        if (!result) {
            log('Account wasn\'t exported', 'info', false);
            return;
        }
        fs.writeFileSync(result.fsPath, JSON.stringify(account), 'utf8');
    }
}
