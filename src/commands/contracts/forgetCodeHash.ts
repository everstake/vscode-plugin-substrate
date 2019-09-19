import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { ContractCodeItem } from '@/trees';

export class ForgetCodeHashCommand extends BaseCommand {
    async run(item: ContractCodeItem) {
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
        vscode.window.showInformationMessage(`Successfully removed code hash "${item.description}"`);
    }
}
