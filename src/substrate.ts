import * as vscode from 'vscode';
import * as util from 'util';
import * as fs from 'fs';
import to from 'await-to-js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair$Json } from '@polkadot/keyring/types';
import { exec as cp_exec } from 'child_process';
import { SubmittableExtrinsicFunction, StorageEntryPromise } from '@polkadot/api/types';

import { NodeInfo } from '@/trees';
import console = require('console');

const exec = util.promisify(cp_exec);

export type AccountKey = KeyringPair$Json;

class ConnectHandler {
    public totalRetries = 0;
    public maxRetries = 0;
    public callback = () => {};

    constructor(maxRetries: number, callback: () => void) {
        this.maxRetries = maxRetries;
        this.callback = callback;
    }

    static create(maxRetries: number, callback: () => void): (...args: any[]) => any {
        const conhan = new ConnectHandler(maxRetries, callback);
        return conhan.handle.bind(conhan);
    }

    handle(...args: any[]): any {
        for (const arg of args) {
            const msg = (arg as Error).message;
            if (msg && msg.indexOf('Unable to find plain type for') !== -1) {
                vscode.window.showErrorMessage('You have to specify types at extrinsic panel to connect');
                this.callback();
                return;
            }
        }
        if (this.totalRetries >= this.maxRetries) {
            this.callback();
            return;
        }
        this.totalRetries++;
    }
}

export class Substrate {
    private api?: ApiPromise;
    private keyring = new Keyring({ type: 'sr25519' });

    constructor(
        private statusBar: vscode.StatusBarItem,
        private globalState: vscode.Memento,
    ) {}

    isConnected(): boolean {
        return this.api ? true : false;
    }

    getConnection(): ApiPromise | undefined {
        return this.api;
    }

    getKeyring(): Keyring {
        return this.keyring;
    }

    async setup() {
        this.statusBar.text = 'Setup extension...';
        this.statusBar.show();

        await this.setupConnection();
        await this.setupDevAccounts();

        let [err, data] = await to(exec('which curl'));
        if (err) {
            await vscode.window.showErrorMessage('You have to install "curl" first');
            this.statusBar.hide();
            return;
        }

        [err, data] = await to(exec('which substrate & which substrate-node-new'));
        if (!err && data!.stdout.indexOf('/') !== -1) {
            await vscode.window.showInformationMessage('Substrate already installed');
            this.statusBar.hide();
            return;
        }

        [err, data] = await to(exec('curl https://getsubstrate.io -sSf | bash -s -- --fast'));
        if (err) {
            await vscode.window.showInformationMessage('Substrate failed to install. Error: ', err);
            this.statusBar.hide();
            return;
        }

        this.statusBar.hide();
        await vscode.window.showInformationMessage('Successfully installed Substrate');
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
            const provider = new WsProvider(endpoint);
            const api = new ApiPromise({ provider });
            api.on('error', ConnectHandler.create(5, () => {
                console.error("Failed to connect");
                vscode.window.showErrorMessage('Failed to connect');
                api.disconnect();
            }));
            await api.isReady;
            this.api = api;
        } catch (err) {
            console.log("TCL: Substrate -> connectTo -> err", err);
        }
        await this.globalState.update('connected-node', name);
        await vscode.commands.executeCommand('nodes.refresh');
    }

    async addTypes() {}

    async updateAccounts(accounts: AccountKey[]) {
        await this.globalState.update('accounts', JSON.stringify(accounts));
    }

    getAcccounts(): AccountKey[] {
        const accounts = this.globalState.get<string>('accounts');
        if (!accounts) {
            return [];
        }
        return JSON.parse(accounts);
    }

    async removeAccount(name: string) {
        const accounts = this.getAcccounts();
        const index = accounts.findIndex((val) => val.meta['name'] === name);
        accounts.splice(index, 1);
        await this.updateAccounts(accounts);
    }

    isAccountExists(name: string): boolean {
        const result = this.getAcccounts();
        const exKey = result.find((val) => val.meta.name === name);
        if (!exKey) {
            return false;
        }
        return true;
    }

    async createKeyringPair(key: string, name: string, type: 'ed25519' | 'sr25519') {
        const pair = this.keyring.addFromUri(key, { name }, type);
        const accounts = this.getAcccounts();
        accounts.push(pair.toJson());
        await this.updateAccounts(accounts);
    }

    async createKeyringPairWithPassword(key: string, name: string, type: 'ed25519' | 'sr25519', pass: string) {
        const pair = this.keyring.addFromUri(key, { name }, type);

        const json = pair.toJson(pass);
        json.meta.whenEdited = Date.now();

        const accounts = this.getAcccounts();
        accounts.push(json);
        await this.updateAccounts(accounts);
    }

    async alterNameOfKeyringPair(oldName: string, newName: string) {
        const accounts = this.getAcccounts();
        for (const account of accounts) {
            if (account.meta['name'] === oldName) {
                account.meta['name'] = newName;
                break;
            }
        }
        await this.updateAccounts(accounts);
    }

    async importKeyringPair(path: string) {
        const rawdata = fs.readFileSync(path);
        const pair: KeyringPair$Json = JSON.parse(rawdata.toString());
        if (this.isAccountExists(pair.meta['name'])) {
            await vscode.window.showWarningMessage('Account with same key already exists. Account not added');
            return;
        }
        const accounts = this.getAcccounts();
        accounts.push(pair);
        this.globalState.update('accounts', JSON.stringify(accounts));
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
        const docs = keys.map((val) => {
            const json = (mod[val] as any).toJSON();
            const doc = json.documentation;
            if (doc) {
                return doc.join('\n');
            }
            return '';
        });
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
}
