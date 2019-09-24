import * as vscode from 'vscode';

import { BaseCommand, log } from "@/common";
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
            log('You are not connected to node', 'warn', true);
        }
        await vscode.commands.executeCommand('nodes.refresh');
        log(`Successfully removed code hash "${item.label}"`, 'info', true);
    }
}
