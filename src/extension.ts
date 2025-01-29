// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ollama from 'ollama';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "protea" is now active!');
	
	
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('protea.protea-search', async () => {
		
		
		const panel = vscode.window.createWebviewPanel (
			'protea',
			'protea: Search Models',
			vscode.ViewColumn.One,
			{ enableScripts: true }

		);

		panel.webview.html = searchPage()

		function searchPage(): string {
			return /*html*/ `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="X-UA-Compatible" content="ie=edge">
				<title>HTML 5 Boilerplate</title>
				<link rel="stylesheet" href="style.css">
			</head>
			<body>
				<h1>Hello</h1>
			</body>
			</html>

			`;

		}


		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello World from protea!');
	});

	context.subscriptions.push(disposable);


	function getWebviewcontent(localModelNames: string[]): string {
		return /*html*/ `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<meta http-equiv="X-UA-Compatible" content="ie=edge">
			<title>Protea Chat</title>
			<link rel="stylesheet" href="style.css">
		</head>
		<body>
			<h2>Chat with Protea</h2>

			<div class='chat-containers'>
				<div class='chat-box' id="chatBox"></div>
				<textarea id='message-input' rows=3 style="width: 100%;" placeholder="Type a message..."></textarea>
			</div>
			<label for="modelSelect">Choose a model: </label>
			<select id="modelSelect">
				${localModelNames.map((model: string) => `<option value="${model}">${model}</option>`).join('')}
			</select>
		</body>
		</html>

		`;

}


// This method is called when your extension is deactivated
export function deactivate() {}
