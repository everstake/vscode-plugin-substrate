import * as vscode from 'vscode';
import * as util from 'util';
import to from 'await-to-js';
import { ApiPromise } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { exec as cp_exec } from 'child_process';

import { NodeInfo, ExtrinsicParameter } from '@/trees';

const exec = util.promisify(cp_exec);

export class Substrate {
    keyring = new Keyring({ type: 'sr25519' });
    enc = new util.TextEncoder();

    constructor(
        private statusBar: vscode.StatusBarItem,
        private globalState: vscode.Memento,
        public api: ApiPromise,
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
