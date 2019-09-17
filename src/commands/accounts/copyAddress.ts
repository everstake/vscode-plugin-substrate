import * as vscode from 'vscode';
import * as clipboard from 'clipboardy';

import BaseCommand from "@/common/baseCommand";
import { AccountItem } from "@/trees";

export class CopyAddressCommand extends BaseCommand {
    async run(item: AccountItem) {
        try {
            await clipboard.write(item.description);
            vscode.window.showInformationMessage('Adddress copied to clipboard');
        } catch (err) {
            vscode.window.showErrorMessage(`Failed to copy address to clipboard: ${err.message}`);
        }
    }
}
