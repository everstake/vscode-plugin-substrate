import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { NodesTreeView, NodeItem, NodeInfo } from "@/trees";

export class RemoveNodeCommand extends BaseCommand {
    async run(item: NodeItem) {
        const tree = this.trees.get('nodes') as NodesTreeView;

        const nodes = this.context.globalState.get<NodeInfo[]>('nodes') || [];
        const index = nodes.findIndex((val) => val.name === item.label);
        nodes.splice(index, 1);
        await this.context.globalState.update('nodes', nodes);

        const connectedNode = this.context.globalState.get('connected-node');
        if (connectedNode === item.label) {
            await this.context.globalState.update('connected-node', undefined);
        }
        vscode.window.showInformationMessage(`Successfully removed node "${item.label}"`);

        tree.refresh();
    }
}
