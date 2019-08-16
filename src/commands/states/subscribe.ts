import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { StatesTreeView, StateItem } from "@/trees";

export class SubscribeCommand extends BaseCommand {
    async run(item: StateItem) {
        const tree = this.trees.get('states') as StatesTreeView;

        console.log('Todo: Add subscribe logic');

        tree.refresh();
    }
}
