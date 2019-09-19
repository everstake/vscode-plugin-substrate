import * as vscode from 'vscode';
import * as clipboard from 'clipboardy';

import BaseCommand from "@/common/baseCommand";
import { ContractsTreeItem } from "@/trees";

export class CopyHashCommand extends BaseCommand {
    async run(item: ContractsTreeItem) {
        if (item.contextValue === 'separator') {
            return;
        }
        try {
            await clipboard.write((item as any).description);
            vscode.window.showInformationMessage('Hash copied to clipboard');
        } catch (err) {
            vscode.window.showErrorMessage(`Failed to copy hash to clipboard: ${err.message}`);
        }
    }
}
