import * as vscode from 'vscode';

import BaseCommand from "@/common/baseCommand";
import { NodesTreeView, NodeInfo } from "@/trees";
import { MultiStepInput } from '@/common';

export class AddNodeCommand extends BaseCommand {
    async run() {
        const tree = this.trees.get('nodes') as NodesTreeView;

        const state = { endpoint: 'ws://127.0.0.1' } as Partial<NodeInfo>;
        // Todo: Fix state change by ref
        const result = MultiStepInput.run(input => this.addNodeName(input, state));
        if (!result) {
            console.log('Node wasn\'t added');
            return;
        }
        console.log(state.name);

        tree.refresh();
    }

    async addNodeName(input: MultiStepInput, state: Partial<NodeInfo>) {
        state.name = await input.showInputBox({
            title: 'Node name',
            step: input.CurrentStepNumber,
            totalSteps: 2,
            prompt: 'The node display name',
            placeholder: 'ex. Polkadot',
            ignoreFocusOut: true,
            value: (typeof state.name === 'string') ? state.name : '',
            validate: async (value) => (!value || !value.trim()) ? 'Hostname is required' : ''
        });
        return (input: MultiStepInput) => this.addNodeEndpoint(input, state);
    }

    async addNodeEndpoint(input: MultiStepInput, state: Partial<NodeInfo>) {
        state.endpoint = await input.showInputBox({
            title: 'Node endpoint',
            step: input.CurrentStepNumber,
            totalSteps: 2,
            prompt: 'The node websocket endpoint',
            placeholder: 'ex. wss://poc3-rpc.polkadot.io/',
            ignoreFocusOut: true,
            value: (typeof state.endpoint === 'string') ? state.endpoint : '',
            validate: async (value) => (!value || !value.trim()) ? 'Hostname is required' : ''
        });
    }
}
