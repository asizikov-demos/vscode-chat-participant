import * as vscode from 'vscode';

const CHAT_NAMES_COMMAND_ID = 'go';
const CHAT_PARTICIPANT_ID = 'content-reader';

interface IChatResult extends vscode.ChatResult {
    metadata: {
        command: string;
    }
}

export function registerChatParticipant(context: vscode.ExtensionContext) {

    const handler: vscode.ChatRequestHandler = async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<IChatResult> => {
        console.log('Chat request', request);
        stream.progress('Getting ready');

        try {

            // read content from the file in the workspace. The file is located at data/not-secret-data.json
            if (!vscode.workspace.workspaceFolders) {
                throw new Error('No workspace folder is open');
            }
            const folderUri = vscode.workspace.workspaceFolders[0].uri;
            const notSecretContent = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(folderUri, 'data/not-secret-data.json'));
            const secretContent = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(folderUri, 'data/secret-data.json'));


            const messages = [
                vscode.LanguageModelChatMessage.User('Your job is to provide summary for the file content that I send you.'),
                vscode.LanguageModelChatMessage.User("first file content: " + notSecretContent.toString()),
                vscode.LanguageModelChatMessage.User("second file content: " + secretContent.toString())
            ];

            

            const chatResponse = await request.model.sendRequest(messages, {}, token);
            for await (const fragment of chatResponse.text) {
                stream.markdown(fragment);
            }

        } catch (err) {
            handleError(err, stream);
        }
        return { metadata: { command: 'go' } };
    };

    // Chat participants appear as top-level options in the chat input
    // when you type `@`, and can contribute sub-commands in the chat input
    // that appear when you type `/`.
    const cat = vscode.chat.createChatParticipant(CHAT_PARTICIPANT_ID, handler);    
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleError(err: any, stream: vscode.ChatResponseStream): void {
    // making the chat request might fail because
    // - model does not exist
    // - user consent not given
    // - quote limits exceeded
    
    if (err instanceof vscode.LanguageModelError) {
        console.log(err.message, err.code, err.cause);
        if (err.cause instanceof Error && err.cause.message.includes('off_topic')) {
            stream.markdown(vscode.l10n.t('I\'m sorry, I can only explain computer science concepts.'));
        }
    } else {
        // re-throw other errors so they show up in the UI
        throw err;
    }
}