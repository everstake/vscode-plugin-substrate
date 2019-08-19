import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { NodesTreeView, NodeItem } from "@/trees";

export class StopNodeCommand extends BaseCommand {
    async run(item: NodeItem) {
        const tree = this.trees.get('nodes') as NodesTreeView;

        console.log('Todo: Add stop node logic');

        tree.refresh();
    }
}
