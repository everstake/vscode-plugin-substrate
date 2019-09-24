import * as vscode from 'vscode';

import { BaseCommand, log } from "@/common";
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
            log('You are not connected to node', 'warn', true);
        }
        await vscode.commands.executeCommand('nodes.refresh');
        log(`Successfully removed contract "${item.label}"`, 'info', true);
    }
}
