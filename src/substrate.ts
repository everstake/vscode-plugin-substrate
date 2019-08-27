import * as vscode from 'vscode';
import * as util from 'util';
import * as fs from 'fs';
import to from 'await-to-js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair, KeyringPair$Json } from '@polkadot/keyring/types';
import { exec as cp_exec } from 'child_process';
import { SubmittableExtrinsicFunction, StorageEntryPromise } from '@polkadot/api/types';

import { NodeInfo, ExtrinsicParameter } from '@/trees';

const exec = util.promisify(cp_exec);

export class Substrate {
    private api?: ApiPromise;
    private keyring = new Keyring({ type: 'sr25519' });

    constructor(
        private statusBar: vscode.StatusBarItem,
        private globalState: vscode.Memento,
    ) {}

    getConnection(): ApiPromise | undefined {
        return this.api;
    }

    async setup() {
        this.statusBar.text = 'Setup extension...';
        this.statusBar.show();

        await this.setupConnection();
        await this.setupDevAccounts();

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

    async setupDevAccounts() {
        // const keyring = new Keyring({ type: 'sr25519' });
        // const alice = keyring.addFromUri('//Alice');
    }

    async setupConnection() {
        const nodes: NodeInfo[] = this.globalState.get('nodes') || [];

        const node = this.globalState.get('connected-node');
        const conNode = nodes.find(val => val.name === node);
        if (conNode) {
            await this.connectTo(conNode.name, conNode.endpoint);
        }

        const defaultNodeName = 'Default';
        const defaultNodeEndpoint = 'ws://127.0.0.1:9944/';
        const defaultNode = nodes.find(val => val.name === defaultNodeName);
        if (!defaultNode) {
            nodes.push({ endpoint: defaultNodeEndpoint, name: defaultNodeName } as NodeInfo);
            await this.globalState.update('nodes', nodes);
        }
    }

    async connectTo(name: string, endpoint: string) {
        try {
            // Todo: Fix errors on failed connection
            // Todo: Fix error on determine types
            const provider = new WsProvider(endpoint);
            const api = await ApiPromise.create({ provider });
            this.api = api;
        } catch (err) {
            console.log("TCL: Substrate -> connectTo -> err", err);
        }
        await this.globalState.update('connected-node', name);
        await vscode.commands.executeCommand('nodes.refresh');
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

    isAccountExists(name: string): boolean {
        const result = this.globalState.get<KeyringPair[]>('accounts') || [];
        const exKey = result.find((val) => val.meta.name === name);
        if (!exKey) {
            return false;
        }
        return true;
    }

    createKeyringPair(key: string, name: string, type: 'ed25519' | 'sr25519') {
        const pair = this.keyring.addFromUri(key, { name }, type);
        const accounts = this.globalState.get<KeyringPair[]>('accounts') || [];
        accounts.push(pair);
        this.globalState.update('accounts', accounts);
    }

    alterNameOfKeyringPair(oldName: string, newName: string) {
        const accounts = this.globalState.get<KeyringPair[]>('accounts') || [];
        for (const account of accounts) {
            if (account.meta['name'] === oldName) {
                account.meta['name'] = newName;
                break;
            }
        }
        this.globalState.update('accounts', accounts);
    }

    importKeyringPair(path: string) {
        const rawdata = fs.readFileSync(path);
        const keyring: KeyringPair$Json = JSON.parse(rawdata.toString());
        const pair = this.keyring.addFromJson(keyring);

        if (this.isAccountExists(pair.meta.name)) {
            vscode.window.showWarningMessage('Account with same key already exists. Account not added');
            return;
        }

        const accounts = this.globalState.get<KeyringPair[]>('accounts') || [];
        accounts.push(pair);
        this.globalState.update('accounts', accounts);
    }

    getExtrinsicModules(): string[] {
        if (!this.isConnected()) {
            return [];
        }
        const keys = Object.keys(this.api!.tx).filter((value) => {
            const res = Object.keys(this.api!.tx[value]);
            if (res.length > 0) {
                return true;
            }
            return false;
        });
        return keys;
    }

    getExtrinsics(key: string): [string[], string[]] {
        if (!this.isConnected()) {
            return [[], []];
        }
        const keys = Object.keys(this.api!.tx[key]);
        const docs = keys.map((val) => this.api!.tx[key][val].toJSON().documentation.join('\n'));
        return [keys, docs];
    }

    getExtrinsic(module: string, key: string): SubmittableExtrinsicFunction<'promise'> | undefined {
        if (!this.isConnected()) {
            return;
        }
        return this.api!.tx[module][key];
    }

    getStateModules(): string[] {
        if (!this.isConnected()) {
            return [];
        }
        const keys = Object.keys(this.api!.query).filter((value) => {
            const res = Object.keys(this.api!.query[value]);
            if (res.length > 0) {
                return true;
            }
            return false;
        });
        return keys;
    }

    getStates(key: string): [string[], string[]] {
        if (!this.isConnected()) {
            return [[], []];
        }
        const mod = this.api!.query[key];
        const keys = Object.keys(mod);
        const docs = keys.map((val) => (mod[val] as any).toJSON().documentation.join('\n'));
        return [keys, docs];
    }

    getState(module: string, key: string): StorageEntryPromise | undefined {
        if (!this.isConnected()) {
            return;
        }
        return this.api!.query[module][key];
    }

    getNodes() {
        return this.globalState.get<NodeInfo[]>('nodes') || [];
    }

    isConnected(): boolean {
        return this.api ? true : false;
    }
}
