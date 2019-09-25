import * as vscode from 'vscode';

import { MultiStepInput, BaseCommand, log } from "@/common";
import { NodeInfo, NodeItem } from "@/trees";

export class EditNodeCommand extends BaseCommand {
    options = {
        title: 'Edit node',
        totalSteps: 2,
    };
    nodeNames: string[] = [];

    async run(item: NodeItem) {
        const nodes: NodeInfo[] = this.context.globalState.get('nodes') || [];
        let index: number = -1;
        this.nodeNames = nodes.map((val, ind) => {
            if (val.name === item.label) {
                index = ind;
            }
            return val.name;
        });
        if (index === -1) {
            log('Node not found', 'warn', true);
            return;
        }

        const state = { name: item.label, endpoint: item.description } as Partial<NodeInfo>;
        const result = await MultiStepInput.run(input => this.addName(input, state));
        if (!result) {
            log('Node wasn\'t changed', 'info', true);
            return;
        }
        const value = state as NodeInfo;

        const connectedNode = this.context.globalState.get('connected-node');
        if (connectedNode === item.label) {
            await this.context.globalState.update('connected-node', value.name);
        }
        await this.substrate.renameCodesAndContractsNode(item.label, value.name);

        nodes[index] = value;
        await this.context.globalState.update('nodes', nodes);
        await vscode.commands.executeCommand('nodes.refresh');
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
                const nodeName = this.nodeNames.find(val => val === value);
                if (nodeName !== undefined && nodeName !== state.name) {
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
