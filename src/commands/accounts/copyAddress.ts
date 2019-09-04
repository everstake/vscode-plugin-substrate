import * as vscode from 'vscode';
import * as cp from 'copy-paste';

import BaseCommand from "@/common/baseCommand";
import { AccountItem } from "@/trees";

export class CopyAddressCommand extends BaseCommand {
    async run(item: AccountItem) {
        cp.copy(item.description);
        vscode.window.showInformationMessage('Adddress copied to clipboard');
    }
}
