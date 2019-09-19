import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { ContractCodeItem } from '@/trees';

export class ForgetContractCommand extends BaseCommand {
    async run(item: ContractCodeItem) {
        try {
            const contracts = this.substrate.getConnectionContracts();
            for (let i = 0; i < contracts.length; i++) {
                const contract = contracts[i];
                if (contract.name === item.label || contract.address === item.description) {
                    contracts.splice(i, 1);
                }
            }
            await this.substrate.updateConnectionContracts(contracts);
        } catch (err) {
            vscode.window.showWarningMessage('You are not connected to node');
        }
        await vscode.commands.executeCommand('nodes.refresh');
        vscode.window.showInformationMessage(`Successfully removed contract "${item.label}"`);
    }
}
