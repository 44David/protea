import * as vscode from 'vscode';
import ollama from 'ollama';

export async function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "protea" is now active!');

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
			vscode.ViewColumn.Two,
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
		<div id="responseText"></div>

		<label for="modelSelect">Choose a model: </label>
		<select id="modelSelect">
			${localModelNames.map((model: string) => `<option value="${model}">${model}</option>`).join('')}
		</select>
		<br />
		<button id="sendMessage">Send</button>
		<div class="chat-containers">
			<div class="chat-box" id="chatBox"></div>
			<textarea id="messageInput" rows="3" style="width: 100%;" placeholder="Type a message..."></textarea>
		</div>

		<script>
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