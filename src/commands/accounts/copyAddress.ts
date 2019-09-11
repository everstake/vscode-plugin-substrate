import * as vscode from 'vscode';
import copy from 'copy-to-clipboard';

import BaseCommand from "@/common/baseCommand";
import { AccountItem } from "@/trees";

export class CopyAddressCommand extends BaseCommand {
    async run(item: AccountItem) {
        copy(item.description);
        vscode.window.showInformationMessage('Adddress copied to clipboard');
    }
}
