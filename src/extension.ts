// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

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

		
		panel.webview.html = getWebviewcontent();
		
		function getWebviewcontent(): string {
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
			
			<h1>Available Models</h1>

			<p id="demo">Click me </p>

			<script>
				const models = fetch("https://ollama-models.zwz.workers.dev/");
					
				const json = models.json();

				document.getElementById("demo").innerHTML = json;
			</script>

			</body>
			</html>

			`;

		}


		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello World from protea!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
