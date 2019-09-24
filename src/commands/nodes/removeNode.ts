import * as vscode from 'vscode';

import { BaseCommand, log } from "@/common";
import { NodeItem, NodeInfo } from "@/trees";

export class RemoveNodeCommand extends BaseCommand {
    async run(item: NodeItem) {
        const nodes = this.context.globalState.get<NodeInfo[]>('nodes') || [];
        const index = nodes.findIndex((val) => val.name === item.label);
        nodes.splice(index, 1);
        await this.context.globalState.update('nodes', nodes);

        const connectedNode = this.context.globalState.get('connected-node');
        if (connectedNode === item.label) {
            await this.context.globalState.update('connected-node', undefined);
            this.substrate.isConnected = false;
            const conn = this.substrate.getConnection();
            if (conn) {
                conn.disconnect();
            }
        }

        await vscode.commands.executeCommand('nodes.refresh');
        log(`Successfully removed node "${item.label}"`, 'info', true);
    }
}
