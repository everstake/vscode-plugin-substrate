import * as vscode from 'vscode';
import * as fs from 'fs';

import BaseCommand from "@/common/baseCommand";
import { AccountItem } from "@/trees";

export class ExportAccountCommand extends BaseCommand {
    async run(item: AccountItem) {
        const accounts = this.substrate.getAcccounts();
        const account = accounts.find(account => account.meta['name'] === item.label);
        if (!account) {
            console.log('Account not found');
            await vscode.window.showInformationMessage('Account not found');
            return;
        }
        const result = await vscode.window.showSaveDialog({});
        if (!result) {
            console.log('Account wasn\'t exported');
            await vscode.window.showInformationMessage('Account wasn\'t exported');
            return;
        }
        fs.writeFileSync(result.fsPath, JSON.stringify(account), 'utf8');
    }
}
