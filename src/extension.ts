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
	const searchCommand = vscode.commands.registerCommand('protea.protea-search', async () => {
		
		
		const panel = vscode.window.createWebviewPanel (
			'protea',
			'protea: Search Models',
			vscode.ViewColumn.One,
			{ enableScripts: true }

		);

		panel.webview.html = searchPage();

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

	});
	context.subscriptions.push(searchCommand);


	const chatCommand = vscode.commands.registerCommand('protea.protea-chat', async () => {

		// Fetch local models from Ollama
		let localModelNames: string[] = [];
		try {
			const response = await ollama.list();
			localModelNames = response.models.map((model: any) => model.name); // Extract model names
		} catch (error) {
			console.error("Failed to fetch local Ollama models:", error);
			localModelNames = ["No local models found"];
		}

		const panel = vscode.window.createWebviewPanel (
			'protea',
			'protea: Chat With Protea',
			vscode.ViewColumn.One,
			{ enableScripts: true }

		);

		function chatPage(localModelNames: string[]): string {
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
					<textarea id='messageInput' rows=3 style="width: 100%;" placeholder="Type a message..."></textarea>
				</div>
				<label for="modelSelect">Choose a model: </label>
				<select id="modelSelect">
					${localModelNames.map((model: string) => `<option value="${model}">${model}</option>`).join('')}
				</select>
				<br/>
				<button id="sendMessage">Send</button>
				<div id="reponseText"></div>
				<script>
					const vscode = acquireVsCodeApi();

					document.getElementById('sendMessage').addEventListener('click', () => {
						const text = document.getElementById("messageInput").value;
						vscode.postMessage({ command: 'message', text });
					})

					window.addEventListener('message', event => {
						const (command, text) = event.data;
						if (command === "chatResponse") {
							document.getElementById('reponseText').innerText = text;
						}
					});

				</script>

			</body>
			</html>

			`;

		};

		panel.webview.html = chatPage(localModelNames);

		panel.webview.onDidReceiveMessage(async (message: any) => {
			if (message.command === 'message') {
				const userPrompt = message.text;
				let responseText = ''; 

				try {
					const streamResponse = await ollama.chat({
						model: 'deepseek-r1:1.5b',
						messages: [{ role: 'user', content: userPrompt}],
						stream: true,
					})
					
					for await (const part of streamResponse) {
						responseText += part.message.content;
						panel.webview.postMessage({ command: 'chatResponse', text: responseText });
					}
				} catch (err) {	
					panel.webview.postMessage({ command: 'chatResponse', text: `Error: ${String(err)}` });
				}
			}
		});

	});
	context.subscriptions.push(chatCommand);

}