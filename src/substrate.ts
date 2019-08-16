import * as vscode from 'vscode';
import * as util from 'util';
import to from 'await-to-js';
import { ApiPromise } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { exec as cp_exec } from 'child_process';

import { Extrinsic, AccountItem, NodeInfo } from './tree';
import { KeyringPair } from '@polkadot/keyring/types';

const exec = util.promisify(cp_exec);

export type ExtrinsicParameter = { type: string, name: string };

export class Substrate {
    keyring = new Keyring({ type: 'sr25519' });
    enc = new util.TextEncoder();

    constructor(
        private statusBar: vscode.StatusBarItem,
        private globalState: vscode.Memento,
        private api: ApiPromise,
    ) {}

    async setup() {
        this.statusBar.text = 'Setup extension...';
        this.statusBar.show();

        this.setupDevAccounts();

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

    setupDevAccounts() {
        // const keyring = new Keyring({ type: 'sr25519' });
        // const alice = keyring.addFromUri('//Alice');
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

    getAcccounts(): KeyringPair[] {
        const accounts = this.globalState.get<KeyringPair[]>('accounts');
        if (!accounts) {
            return [];
        }
        return accounts;
    }

    async addAccount() {
        const name = await vscode.window.showInputBox({
            prompt: `Account name`,
        });
        if (name === undefined) {
            return;
        }
        const key = await vscode.window.showInputBox({
            prompt: `Account key`,
        });
        if (key === undefined) {
            return;
        }
        if (this.isAccountExists(key)) {
            vscode.window.showWarningMessage('Account with same key already exists. Account not added');
            return;
        }

        const pair = this.createKeyringPair(key);
        pair.setMeta({ name });

        const accounts = this.globalState.get<KeyringPair[]>('accounts') || [];
        accounts.push(pair);
        this.globalState.update('accounts', accounts);
    }

    isAccountExists(key: string): boolean {
        const result = this.globalState.get<KeyringPair[]>('accounts') || [];
        const exKey = result.find((val) => val.meta.name === key);
        if (!exKey) {
            return false;
        }
        return true;
    }

    createKeyringPair(key: string): KeyringPair {
        const pair = this.keyring.addFromUri(key);
        if (pair) {
            return pair;
        }
        // Todo: Add mnemonic and json input
        const newPair = this.keyring.addFromSeed(this.enc.encode(key));
        return newPair;
    }

    async removeAccount(item: AccountItem) {
        const response = await vscode.window.showInputBox({
            prompt: `Are you sure want to remove account ${item.label}`,
        });
        if (response !== 'yes') {
            return;
        }
        const accounts = this.globalState.get<KeyringPair[]>('accounts') || [];
        const index = accounts.findIndex((val) => val.address === item.description);
        accounts.splice(index, 1);
        this.globalState.update('accounts', accounts);
        vscode.window.showInformationMessage(`Successfully removed account "${item.label}"`);
    }

    getExtrinsicModules(): string[] {
        const keys = Object.keys(this.api.tx).filter((value) => {
            const res = Object.keys(this.api.tx[value]);
            if (res.length > 0) {
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

    getStateModules(): string[] {
        const keys = Object.keys(this.api.query).filter((value) => {
            const res = Object.keys(this.api.query[value]);
            if (res.length > 0) {
                return true;
            }
            return false;
        });
        return keys;
    }

    getStates(key: string): [string[], string[]] {
        const keys = Object.keys(this.api.query[key]);
        const docs = keys.map((val) => (this.api.query[key][val] as any).toJSON().documentation.join('\n'));
        return [keys, docs];
    }

    getNodes() {
        return this.globalState.get<NodeInfo[]>('nodes') || [];
    }

    isConnected(): boolean {
        return this.api ? true : false;
    }
}
