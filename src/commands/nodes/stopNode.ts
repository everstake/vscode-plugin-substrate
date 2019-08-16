import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { NodesTreeView, NodeInfo } from "@/trees";

export class StopNodeCommand extends BaseCommand {
    async run(item: NodeInfo) {
        const tree = this.trees.get('nodes') as NodesTreeView;

        console.log('Todo: Add stop node logic');

        tree.refresh();
    }
}
