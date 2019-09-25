import * as vscode from 'vscode';
import * as util from 'util';
import * as path from 'path';
import * as fs from 'fs';
import to from 'await-to-js';
import { exec as cp_exec } from 'child_process';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair$Json } from '@polkadot/keyring/types';
import { SubmittableExtrinsicFunction, StorageEntryPromise } from '@polkadot/api/types';
import { KeypairType } from '@polkadot/util-crypto/types';
import { RegistryTypes } from '@polkadot/types/types';
import { Abi } from '@polkadot/api-contract';

import { NodeInfo, ContractCodeInfo, ContractInfo } from '@/trees';
import { log } from '@/common';
import { ConnectionHandler } from './connectionHandler';

const exec = util.promisify(cp_exec);

export type AccountKey = KeyringPair$Json;
export type ContractCodes = { [index: string]: ContractCodeInfo[] };
export type Contracts = { [index: string]: ContractInfo[] };

export class Substrate {
    public isConnected = false;
    private api?: ApiPromise;
    private keyring = new Keyring({ type: 'sr25519' });

    constructor(
        private context: vscode.ExtensionContext,
        public config: vscode.WorkspaceConfiguration,
    ) {}

    getConnection(): ApiPromise | undefined {
        return this.api;
    }

    getKeyring(): Keyring {
        return this.keyring;
    }

    async installSubstrate() {
        let [err, data] = await to(exec('which curl'));
        if (err) {
            log('You have to install "curl" first to proceed with substrate installation', 'error', false);
            return;
        }
        [err, data] = await to(exec('which substrate & which substrate-node-new'));
        if (!err && data!.stdout.indexOf('/') !== -1) {
            log('Substrate already installed. Skipping installation', 'info', false);
            return;
        }
        [err, data] = await to(exec('curl https://getsubstrate.io -sSf | bash -s -- --fast'));
        if (err) {
            log(`Substrate failed to install. Error: ${err.message}`, 'error', true);
            return;
        }
        log('Successfully installed Substrate', 'info', true);
    }

    async setupConnection() {
        const nodes: NodeInfo[] = this.context.globalState.get('nodes') || [];
        const node = this.context.globalState.get('connected-node');
        const conNode = nodes.find(val => val.name === node);
        if (conNode) {
            await this.connectTo(conNode.name, conNode.endpoint);
        }
        const defaultNodeName = 'Default';
        const defaultNodeEndpoint = this.config.get<string>('plugin-polkadot.defaultConnectionURL', 'ws://127.0.0.1:9944/');
        const defaultNode = nodes.find(val => val.name === defaultNodeName);
        if (!defaultNode) {
            nodes.push({ endpoint: defaultNodeEndpoint, name: defaultNodeName } as NodeInfo);
            await this.context.globalState.update('nodes', nodes);
    		await vscode.commands.executeCommand('nodes.refresh');
        }
    }

    async disconnect() {
        if (this.api) {
            this.api!.disconnect();
        }
        this.api = undefined;
        this.isConnected = false;
        await this.context.globalState.update('connected-node', undefined);
    }

    async getTypes(): Promise<RegistryTypes | undefined> {
        const globalPath = this.context.globalStoragePath;
        const filePath = path.join(globalPath, 'types.json');
        const [err, buf] = await to<Buffer>(fs.promises.readFile(filePath));
        if (err) {
            log('File with types not found', 'error', false);
            return;
        }
        return JSON.parse(buf!.toString());
    }

    async connectTo(name: string, endpoint: string, additionalTypes?: RegistryTypes) {
        const connectedNode = this.context.globalState.get('connected-node');
        if (connectedNode && connectedNode === 'name') {
            log('Already connected', 'info', false);
            return;
        }
        try {
            const types = await this.getTypes();
            const provider = new WsProvider(endpoint);
            const api = new ApiPromise({ provider, types: {
                ...this.config.get('plugin-polkadot.defaultSubstrateTypes', {}),
                ...types,
                ...additionalTypes,
            }});
            api.on('error', ConnectionHandler.create(
                this.config.get<number>('plugin-polkadot.connectionRetryCount', 5),
                () => {
                    console.error("Failed to connect");
                    vscode.window.showErrorMessage('Failed to connect');
                    api.disconnect();
                    this.isConnected = false;
                    vscode.commands.executeCommand('nodes.refresh');
                },
            ));
            await api.isReady;
            this.api = api;
            this.isConnected = true;
        } catch (err) {
            console.error('Error on connect:', err);
        }
        await this.context.globalState.update('connected-node', name);
        await vscode.commands.executeCommand('nodes.refresh');
    }

    async updateAccounts(accounts: AccountKey[]) {
        await this.context.globalState.update('accounts', JSON.stringify(accounts));
    }

    getAcccounts(): AccountKey[] {
        const accounts = this.context.globalState.get<string>('accounts');
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

    async createKeyringPair(key: string, name: string, type: KeypairType) {
        const pair = this.keyring.addFromUri(key, { name }, type);
        const accounts = this.getAcccounts();
        accounts.push(pair.toJson());
        await this.updateAccounts(accounts);
    }

    async createKeyringPairWithPassword(key: string, name: string, type: KeypairType, pass: string) {
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
            vscode.window.showWarningMessage('Account with same key already exists. Account not added');
            return;
        }
        const accounts = this.getAcccounts();
        accounts.push(pair);
        await this.updateAccounts(accounts);
    }

    getContractCodes(): ContractCodes {
        const contractsString = this.context.globalState.get<string>('contract-codes');
        if (!contractsString) {
            return {};
        }
        return JSON.parse(contractsString);
    }

    getConnectionContractCodes(): ContractCodeInfo[] {
        if (!this.isConnected) {
            return [];
        }
        const connectedNode = this.context.globalState.get<string>('connected-node');
        if (!connectedNode) {
            throw Error('Not connected to node');
        }
        const contractCodes = this.getContractCodes();
        const nodeContractCodes = contractCodes[connectedNode] || [];
        return nodeContractCodes;
    }

    async updateContractCodes(codes: ContractCodes) {
        await this.context.globalState.update('contract-codes', JSON.stringify(codes));
        await vscode.commands.executeCommand('nodes.refresh');
    }

    async updateConnectionContractCodes(codes: ContractCodeInfo[]) {
        const connectedNode = this.context.globalState.get<string>('connected-node');
        if (!connectedNode) {
            throw Error('Not connected to node');
        }
        const contractCodes = this.getContractCodes();
        contractCodes[connectedNode] = codes;
        await this.updateContractCodes(contractCodes);
    }

    async saveContractCode(name: string, codeHash: string) {
        const codes = this.getConnectionContractCodes();
        const existingContractCode = codes.find(
            contractCode => contractCode.hash === codeHash || contractCode.name === name
        );
        if (existingContractCode) {
            existingContractCode.name = name;
            existingContractCode.hash = codeHash;
        } else {
            codes.push({ name, hash: codeHash });
        }
        await this.updateConnectionContractCodes(codes);
    }

    getContracts(): Contracts {
        const contractsString = this.context.globalState.get<string>('contracts');
        if (!contractsString) {
            return {};
        }
        return JSON.parse(contractsString);
    }

    getConnectionContracts(): ContractInfo[] {
        if (!this.isConnected) {
            return [];
        }
        const connectedNode = this.context.globalState.get<string>('connected-node');
        if (!connectedNode) {
            throw Error('Not connected to node');
        }
        const contracts = this.getContracts();
        const nodeContracts = contracts[connectedNode] || [];
        nodeContracts.forEach((contract: ContractInfo) => {
            contract.abi = new Abi(contract.abi.abi);
        });
        return nodeContracts;
    }

    async updateContracts(codes: Contracts) {
        await this.context.globalState.update('contracts', JSON.stringify(codes));
        await vscode.commands.executeCommand('nodes.refresh');
    }

    async updateConnectionContracts(codes: ContractInfo[]) {
        const connectedNode = this.context.globalState.get<string>('connected-node');
        if (!connectedNode) {
            throw Error('Not connected to node');
        }
        const contracts = this.getContracts();
        contracts[connectedNode] = codes;
        await this.updateContracts(contracts);
    }

    async saveContract(contractName: string, contractAddress: string, abi: Abi) {
        const contracts = this.getConnectionContracts();
        const existingContract = contracts.find(
            contract => contract.name === contractName || contract.address === contractAddress
        );
        if (existingContract) {
            existingContract.name = contractName;
            existingContract.address = contractAddress;
            existingContract.abi = abi;
        } else {
            contracts.push({
                name: contractName,
                address: contractAddress,
                abi: abi,
            });
        }
        await this.updateConnectionContracts(contracts);
    }

    async renameCodesAndContractsNode(oldNodeName: string, newNodeName: string): Promise<void> {
        const codes = this.getContractCodes();
        const contracts = this.getContracts();

        const nodeCodes = codes[oldNodeName];
        const nodeContracts = contracts[oldNodeName];
        delete codes[oldNodeName];
        delete contracts[oldNodeName];
        codes[newNodeName] = nodeCodes;
        contracts[newNodeName] = nodeContracts;

        await this.updateContractCodes(codes);
        await this.updateContracts(contracts);
    }

    getExtrinsicModules(): string[] {
        if (!this.isConnected) {
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
        if (!this.isConnected) {
            return [[], []];
        }
        const keys = Object.keys(this.api!.tx[key]);
        const docs = keys.map((val) => this.api!.tx[key][val].toJSON().documentation.join('\n'));
        return [keys, docs];
    }

    getExtrinsic(module: string, key: string): SubmittableExtrinsicFunction<'promise'> | undefined {
        if (!this.isConnected) {
            return;
        }
        return this.api!.tx[module][key];
    }

    getStateModules(): string[] {
        if (!this.isConnected) {
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
        if (!this.isConnected) {
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
        if (!this.isConnected) {
            return;
        }
        return this.api!.query[module][key];
    }

    getNodes() {
        return this.context.globalState.get<NodeInfo[]>('nodes') || [];
    }
}
