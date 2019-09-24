import * as vscode from 'vscode';

type LogLevel = 'info' | 'warn' | 'error';

export const log = (message: string, level: LogLevel, showFlotMessage: boolean = false) => {
    let floatMessage = vscode.window.showInformationMessage;
    let consoleMessage = console.log;
    switch (level) {
        case 'info': {
            consoleMessage = console.log;
            floatMessage = vscode.window.showInformationMessage;
            break;
        }
        case 'warn': {
            consoleMessage = console.warn;
            floatMessage = vscode.window.showWarningMessage;
            break;
        }
        case 'error': {
            consoleMessage = console.error;
            floatMessage = vscode.window.showErrorMessage;
            break;
        }
    }
    consoleMessage(message);
    if (showFlotMessage) {
        floatMessage(message);
    }
};
