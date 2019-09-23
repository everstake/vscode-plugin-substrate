import * as vscode from 'vscode';
import * as fs from 'fs';
import { Abi } from '@polkadot/api-contract';

import BaseCommand from "@/common/baseCommand";
import { MultiStepInput } from '@/common';

type AddExistingContractArgs = {
    contract_address: string,
    contract_name: string,
    contract_abi: Abi,
};

export class AddExistingContractCommand extends BaseCommand {
    options = {
        title: 'Add existing contract',
        totalSteps: 3,
        ignoreFocusOut: true,
    };

    async run() {
        const state = {} as Partial<AddExistingContractArgs>;
        const argResult = await MultiStepInput.run(input => this.addContractAddress(input, state));
        if (!argResult) {
            vscode.window.showInformationMessage('Add existing code execution canceled');
            return;
        }
        const value = state as AddExistingContractArgs;

        try {
            await this.substrate.saveContract(value.contract_name, value.contract_address, value.contract_abi);
            vscode.window.showInformationMessage('Successfully added contract');
        } catch (err) {
            vscode.window.showErrorMessage(`Failed to store contract`);
        }
    }

    async addContractAddress(input: MultiStepInput, state: Partial<AddExistingContractArgs>) {
        state.contract_address = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'The address for the deployed contract instance',
            placeholder: 'ex. 0xa54a4b44bb0a02b53a59bd47b478dcf1cc451eaee651bebc1bef5fa423b7014b',
            ignoreFocusOut: true,
            value: (typeof state.contract_address === 'string') ? state.contract_address : '',
            validate: async (value) => (!value || !value.trim()) ? 'Contract address is required' : ''
        });
        return (input: MultiStepInput) => this.addContractName(input, state);
    }

    async addContractName(input: MultiStepInput, state: Partial<AddExistingContractArgs>) {
        state.contract_name = await input.showInputBox({
            ...this.options,
            step: input.CurrentStepNumber,
            prompt: 'A name for the deployed contract to help users distinguish',
            placeholder: 'ex. Flipper contract',
            ignoreFocusOut: true,
            value: (typeof state.contract_name === 'string') ? state.contract_name : '',
            validate: async (value) => (!value || !value.trim()) ? 'Contract name is required' : ''
        });
        return (input: MultiStepInput) => this.addContractAbi(input, state);
    }

    async addContractAbi(input: MultiStepInput, state: Partial<AddExistingContractArgs>) {
        const uri = await input.showOpenDialog({
            ...this.options,
            shouldResume: async () => true,
            step: input.CurrentStepNumber,
            openLabel: 'Choose ABI',
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'JSON': ['json'],
            },
        });
        if (!uri || uri && uri.length <= 0) {
            throw Error('Abi not specified');
        }
        const codePath = uri[0].fsPath;
        const abiBytes: Uint8Array = await fs.promises.readFile(codePath);
        const abiJson = JSON.parse(abiBytes.toString());
        const abi = new Abi(abiJson);
        state.contract_abi = abi;
    }
}
