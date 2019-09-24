import * as vscode from 'vscode';

export class ConnectionHandler {
    public totalRetries = 0;
    public maxRetries = 0;
    public callback = () => {};

    constructor(maxRetries: number, callback: () => void) {
        this.maxRetries = maxRetries;
        this.callback = callback;
    }

    static create(maxRetries: number, callback: () => void): (...args: any[]) => any {
        const conhan = new ConnectionHandler(maxRetries, callback);
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
