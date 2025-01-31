import * as vscode from 'vscode';
import ollama, { Message } from 'ollama';
import { marked } from 'marked';

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
		let memory: Message[] = [ ];

		panel.webview.onDidReceiveMessage(async (message: any) => {
			console.log('Message received:', message);  // debug
	
			if (message.command === 'userMessage') {
				panel.webview.postMessage({ command: "chatResponse", text: message.text, role: "user" });
				return;
			}
			
			if (message.command === 'message') {
				const userPrompt = message.text;
				const selectedModel = message.model;
				let responseText = ''; 
				
				memory.push({role: 'user', content: userPrompt });
				memory.push({role: 'bot', content: responseText });

				try {
					const streamResponse = await ollama.chat({
						model: selectedModel,
						messages: memory,
						stream: true,
					});					
					for await (const part of streamResponse) {
						responseText += part.message.content;
						panel.webview.postMessage({ command: 'chatResponse', text: marked.parse(responseText), role: "bot" });
						console.log("MESSAGE CONTENT", message.content);

					}

				} catch (err) {  
					console.error('Error in chat response:', err);  // debug
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
		<style>

			* {

                font-family: Arial, Helvetica, sans-serif;
			}
			.chat-box {
				max-height: 300px;
				overflow-y: auto;
				padding: 10px;
				margin-bottom: 10px;
				display: flex;
				flex-direction: column;
				
			}

			.user-message {
				background-color:rgb(57, 57, 57);
				color: white;
				padding: 8px;
				border-radius: 5px;
				margin: 5px 0;
				align-self: flex-end;
			}

			.bot-message {
				padding: 8px;
				border-radius: 2px;
				margin: 5px 0;
				align-self: flex-start;
			}

			#messageInput {
				background-color:rgb(57, 57, 57);
				border-radius: 10px;
				padding: 7px;
				color: white;
			}
			
		</style>
	</head>
	<body>

		<div class="container">

			<label for="modelSelect">Choose a model: </label>
			<select id="modelSelect">
				${localModelNames.map((model: string) => `<option value="${model}">${model}</option>`).join('')}
			</select>
			<br />

			<div class="chat-containers">
				<div class="chat-box" id="chatBox" role="log"></div>
				<textarea id="messageInput" class="messageInput" rows="3" style="width: 100%;" placeholder="Type a message..."></textarea>
				<button id="sendMessage">Send</button>
			</div>
		</div>


		<script>
			const vscode = acquireVsCodeApi();

			document.getElementById('sendMessage').addEventListener('click', () => {
				const text = document.getElementById("messageInput").value;
				const selectedModel = document.getElementById("modelSelect").value;

				if(!text.trim()) return;

				vscode.postMessage({ command: 'userMessage', text, role: 'user' });
				vscode.postMessage({ command: 'message', text, model: selectedModel })

				document.getElementById("messageInput").value = ""
			});

			window.addEventListener('message', event => {
				const { command, text, role } = event.data;
				const chatBox = document.getElementById("chatBox");

				if (command === "chatResponse" || command === "userMessage") {
					const messageDiv = document.createElement('div');
					messageDiv.classList.add(role === "user" ? "user-message" : "bot-message");
					if (role === "bot") {
						let lastMessage = chatBox.lastElementChild;
						if (lastMessage.classList.contains("bot-message")) {
							lastMessage.innerHTML = text;
							return;
						}
					}

					messageDiv.innerHTML = text;
					chatBox.appendChild(messageDiv);
					chatBox.scrollTop = chatBox.scrollHeight;
				}
			});
		</script>
	</body>
	</html>
	`;
}}