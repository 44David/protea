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
		
		const response = await fetch("https://ollama-models.zwz.workers.dev/");

		const data = await response.json();

		const json = data;
		
		const panel = vscode.window.createWebviewPanel (
			'protea',
			'protea: Search Models',
			vscode.ViewColumn.One,
			{ enableScripts: true }

		);

		

		console.log("your page was created"); // debug
		const generatedHtml = searchPage(json);
		console.log("Generated HTML:", generatedHtml);
		panel.webview.html = generatedHtml;
		console.log("searchPage HTML set"); // debug

		panel.webview.onDidReceiveMessage(async (message: any) => {
			console.log("Message received:", message);
			if (message.command === 'pullModel') {
				vscode.window.showInformationMessage("Pull model clicked!");
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

		console.log("Webview panel created"); // debug
		
		panel.webview.html = chatPage(localModelNames);

		panel.webview.onDidReceiveMessage(async (message: any) => {
			console.log('Message received:', message);  // debug
			if (message.command === 'message') {
				const userPrompt = message.text;
				const selectedModel = message.model;
				let responseText = ''; 

				try {
					const streamResponse = await ollama.chat({
						model: selectedModel,
						messages: [{ role: 'user', content: userPrompt}],
						stream: true,
					});
					console.log("Ollama response:", streamResponse);
					
					for await (const part of streamResponse) {
						responseText += part.message.content;
						panel.webview.postMessage({ command: 'chatResponse', text: responseText });
					}
				} catch (err) {  
					console.error('Error in chat response:', err);  // Debugging line
					panel.webview.postMessage({ command: 'chatResponse', text: `Error: ${String(err)}` });
				}
			}
		});

	});

	context.subscriptions.push(chatCommand);

});

function searchPage(json: JSON): string {
	return /*html*/ `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline' 'self';">
		<title>Test Webview</title>
		<style>
			.button-pull {
				background-image: linear-gradient(92.88deg, #455EB5 9.16%, #5643CC 43.89%, #673FD7 64.72%);
				border-radius: 8px;
				border-style: none;
				box-sizing: border-box;
				color: #FFFFFF;
				cursor: pointer;
				flex-shrink: 0;
				font-family: "Inter UI","SF Pro Display",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,Cantarell,"Open Sans","Helvetica Neue",sans-serif;
				font-size: 16px;
				font-weight: 500;
				height: 1.5rem;
				padding: 0 1.6rem;
				text-align: center;
				text-shadow: rgba(0, 0, 0, 0.25) 0 3px 8px;
				transition: all .5s;
				user-select: none;
				-webkit-user-select: none;
				touch-action: manipulation;
			}

			.button-36:hover {
				box-shadow: rgba(80, 63, 205, 0.5) 0 1px 30px;
				transition-duration: .1s;
			}

			@media (min-width: 768px) {
				.button-36 {
					padding: 0 2.6rem;
				}
			}
		</style>
	</head>
		<body>
			<div>
				${
					//@ts-ignore
					json.map((model) => `<h1>${model.name}</h1><p>${model.description}</p><button class="button-pull" class="pullButton" role="button">Pull</button>`).join('')	
				}
			</div>

			<script>
				try {
					document.querySelectorAll('.pullButton').forEach(button => {
						button.addEventListener('click', () => {
							console.log('Button clicked!');
							vscode.postMessage({ command: 'pullModel' });
						});
					});
				} catch (error) {
					console.error("Error attaching event listeners:", error);
				}
			</script>
		</body>
	</html>

	`;

}

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
		<div class="chat-containers">
			<div class="chat-box" id="chatBox"></div>
			<textarea id="messageInput" rows="3" style="width: 100%;" placeholder="Type a message..."></textarea>
		</div>
		<label for="modelSelect">Choose a model: </label>
		<select id="modelSelect">
			${localModelNames.map((model: string) => `<option value="${model}">${model}</option>`).join('')}
		</select>
		<br />
		<button id="sendMessage">Send</button>
		<div id="responseText"></div>

		<script>
			console.log("chat.js loaded!");
			const vscode = acquireVsCodeApi();

			document.getElementById('sendMessage').addEventListener('click', () => {
				const text = document.getElementById("messageInput").value;
				const selectedModel = document.getElementById("modelSelect").value;
				console.log('Sending message:', text); 	
				vscode.postMessage({ command: 'message', text, model: selectedModel });
			});

			window.addEventListener('message', event => {
				const { command, text } = event.data;
				if (command === "chatResponse") {
					document.getElementById('responseText').innerText = text;
				}
			});
		</script>
	</body>
	</html>
	`;
}}