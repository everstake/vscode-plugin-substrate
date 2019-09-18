import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { ContractsTreeItem } from '@/trees';

export class ForgetCodeHashCommand extends BaseCommand {
    async run(item: ContractsTreeItem) {
        try {
            const codes = this.substrate.getConnectionContractCodes();
            for (let i = 0; i < codes.length; i++) {
                const code = codes[i];
                if (code.hash === item.description || code.name === item.label) {
                    codes.splice(i, 1);
                }
            }
            await this.substrate.updateConnectionContractCodes(codes);
        } catch (err) {
            vscode.window.showWarningMessage('You are not connected to node');
        }
        await vscode.commands.executeCommand('nodes.refresh');
        vscode.window.showInformationMessage(`Successfully removed node "${item.label}"`);
    }
}
