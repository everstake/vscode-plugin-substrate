import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { NodesTreeView, NodeInfo } from "@/trees";

export class RemoveNodeCommand extends BaseCommand {
    async run(item: NodeInfo) {
        const tree = this.trees.get('nodes') as NodesTreeView;

        console.log('Todo: Add remove logic');

        tree.refresh();
    }
}
