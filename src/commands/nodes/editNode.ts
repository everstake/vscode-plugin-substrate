import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { NodesTreeView, NodeInfo, NodeItem } from "@/trees";
import { MultiStepInput } from '@/common';

export class EditNodeCommand extends BaseCommand {
    options = {
        title: 'Edit node',
        totalSteps: 2,
    };
    nodeNames: string[] = [];

    async run(item: NodeItem) {
        const tree = this.trees.get('nodes') as NodesTreeView;
        const nodes: NodeInfo[] = this.context.globalState.get('nodes') || [];
        let index: number = -1;
        this.nodeNames = nodes.map((val, ind) => {
            if (val.name === item.label) {
                index = ind;
            }
            return val.name;
        });
        if (index === -1) {
            console.log('Node not found');
            await vscode.window.showInformationMessage('Node not found');
            return;
        }

        const state = { name: item.label, endpoint: item.description } as Partial<NodeInfo>;
        const result = await MultiStepInput.run(input => this.addName(input, state));
        if (!result) {
            // Todo: Move to logger
            console.log('Node wasn\'t changed');
            await vscode.window.showInformationMessage('Node wasn\'t changed');
            return;
        }

        nodes[index] = state as NodeInfo;
        await this.context.globalState.update('nodes', nodes);

        tree.refresh();
    }

    async addName(input: MultiStepInput, state: Partial<NodeInfo>) {
        state.name = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'The node display name',
            placeholder: 'ex. Polkadot Testnet',
            ignoreFocusOut: true,
            value: (typeof state.name === 'string') ? state.name : '',
            validate: async (value: string) => {
                if (!value || !value.trim()) {
                    return 'Name is required';
                }
                if (this.nodeNames.find(val => val === value) !== undefined) {
                    return 'Node with same name already exists';
                }
                return '';
            }
        });
        return (input: MultiStepInput) => this.addEndpoint(input, state);
    }

    async addEndpoint(input: MultiStepInput, state: Partial<NodeInfo>) {
        state.endpoint = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'The node websocket endpoint',
            placeholder: 'ex. wss://poc3-rpc.polkadot.io/',
            ignoreFocusOut: true,
            value: (typeof state.endpoint === 'string') ? state.endpoint : '',
            validate: async (value) => (!value || !value.trim()) ? 'Endpoint is required' : ''
        });
    }
}
