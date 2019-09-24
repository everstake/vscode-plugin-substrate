import * as vscode from 'vscode';

import { BaseCommand, log } from "@/common";
import { AccountItem } from "@/trees";

export class RemoveAccountCommand extends BaseCommand {
    async run(item: AccountItem) {
        await this.substrate.removeAccount(item.label);
        log(`Successfully removed account "${item.label}"`, 'info', true);
        await vscode.commands.executeCommand('nodes.refresh');
    }
}
