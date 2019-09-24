import * as vscode from 'vscode';
import * as clipboard from 'clipboardy';

import { BaseCommand, log } from "@/common";
import { ContractsTreeItem } from "@/trees";

export class CopyHashCommand extends BaseCommand {
    async run(item: ContractsTreeItem) {
        try {
            await clipboard.write((item as any).description);
            log('Hash copied to clipboard', 'info', true);
        } catch (err) {
            log(`Failed to copy hash to clipboard: ${err.message}`, 'error', true);
        }
    }
}
