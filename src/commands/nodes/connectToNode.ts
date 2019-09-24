import * as vscode from 'vscode';

import { BaseCommand } from "@/common";
import { NodeItem } from "@/trees";

export class ConnectToNodeCommand extends BaseCommand {
    async run(item: NodeItem) {
        await this.substrate.connectTo(item.label, item.description);
        await vscode.commands.executeCommand('nodes.refresh');
    }
}
