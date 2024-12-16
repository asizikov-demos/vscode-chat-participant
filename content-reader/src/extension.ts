import * as vscode from 'vscode';
import { registerChatParticipant } from './chat-participant'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	registerChatParticipant(context);
	console.log('Congratulations, your extension "content-reader" is now active!');
}

// This method is called when your extension is deactivated
export function deactivate() {}
