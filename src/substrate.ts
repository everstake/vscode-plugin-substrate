import * as vscode from 'vscode';
import * as util from 'util';
import to from 'await-to-js';
import { ApiPromise } from '@polkadot/api';
import { exec as cp_exec, spawn } from 'child_process';

import { Extrinsic } from './tree';

const exec = util.promisify(cp_exec);

export type ExtrinsicParameter = { type: string, name: string };

export class Substrate {
    constructor(
        private statusBar: vscode.StatusBarItem,
        private workspaceRoot: string,
        private api: ApiPromise,
    ) {}

    async setup() {
        this.statusBar.text = 'Setup extension...';
        this.statusBar.show();

        let [err, data] = await to(exec('which curl'));
        if (err) {
            vscode.window.showErrorMessage('You have to install "curl" first');
            this.statusBar.hide();
            return;
        }

        [err, data] = await to(exec('which substrate & which substrate-node-new'));
        if (!err && data!.stdout.indexOf('/') !== -1) {
            vscode.window.showInformationMessage('Substrate already installed');
            this.statusBar.hide();
            return;
        }

        [err, data] = await to(exec('curl https://getsubstrate.io -sSf | bash -s -- --fast'));
        if (err) {
            vscode.window.showInformationMessage('Substrate failed to install. Error: ', err);
            this.statusBar.hide();
            return;
        }

        this.statusBar.hide();
        vscode.window.showInformationMessage('Successfully installed Substrate');
    }

    async startNode() {
        console.log('Starting substrate node');

        this.statusBar.text = 'Starting node...';
        this.statusBar.show();

        const [err, data] = await to(exec('which substrate & which cargo'));
        if (err) {
            vscode.window.showErrorMessage("Substrate not installed");
            this.statusBar.hide();
            return;
        }

        this.statusBar.hide();
    	vscode.window.showInformationMessage('Substrate node running on port: 9944');
    }

    async stopNode() {
    	vscode.window.showInformationMessage('Stoping substrate node');
    }

    async clearChainData() {
    	vscode.window.showInformationMessage('Clearing chain data');
    }

    async runExtrinsic(item: Extrinsic) {
        const module = this.api.tx[item.module];
        const extrinsic = module[item.label];
        const extObj = extrinsic.toJSON();
        const params: ExtrinsicParameter[] = extObj.args;

        // Todo: Choose account
        const responses = await this.getValuesFromInput(params);
        if (responses.length < params.length) {
        	vscode.window.showInformationMessage('Extrinsic execution canceled');
            return;
        }
        // Todo: Sign transaction with choosed account
        // const result = extrinsic(...responses).signAndSend();
        console.log("TCL: Substrate -> runExtrinsic -> responses", responses);
	}

    async getValuesFromInput(params: ExtrinsicParameter[]): Promise<string[]> {
        const responses: string[] = [];
        for (const [id, param] of params.entries()) {
            const response = await vscode.window.showInputBox({
                prompt: `${id+1}/${params.length} - ${param.name}: ${param.type}`,
            });
            if (response === undefined) {
                break;
            }
            responses.push(response);
        }
        return responses;
    }

    getExtrinsicModules(): string[] {
        const keys = Object.keys(this.api.tx).filter((value) => {
            const extrinsics = Object.keys(this.api.tx[value]);
            if (extrinsics.length > 0) {
                return true;
            }
            return false;
        });
        return keys;
    }

    getExtrinsics(key: string): [string[], string[]] {
        const keys = Object.keys(this.api.tx[key]);
        const docs = keys.map((val) => this.api.tx[key][val].toJSON().documentation.join('\n'));
        return [keys, docs];
    }

    isConnected(): boolean {
        return this.api ? true : false;
    }
}
