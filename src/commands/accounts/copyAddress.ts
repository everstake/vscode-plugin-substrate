import * as vscode from 'vscode';
import * as clipboard from 'clipboardy';

import { BaseCommand, log } from "@/common";
import { AccountItem } from "@/trees";

export class CopyAddressCommand extends BaseCommand {
    async run(item: AccountItem) {
        try {
            await clipboard.write(item.description);
            log('Adddress copied to clipboard', 'info', true);
        } catch (err) {
            log(`Failed to copy address to clipboard: ${err.message}`, 'error', true);
        }
    }
}
