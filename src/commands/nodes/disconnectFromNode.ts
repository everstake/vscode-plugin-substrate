import * as vscode from 'vscode';
import BaseCommand from "@/common/baseCommand";

export class DisconnectFromNodeCommand extends BaseCommand {
    async run() {
        await this.substrate.disconnect();
        await vscode.commands.executeCommand('nodes.refresh');
    }
}
