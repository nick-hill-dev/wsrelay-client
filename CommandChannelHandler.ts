module WSRelayClient {

    export abstract class CommandChannelHandler implements IChannelHandler {

        abstract channelStatus(client: WebSocketRelayClient, online: boolean);

        abstract assignUserNumber(client: WebSocketRelayClient, userNumber: number);

        abstract assignRealmNumber(client: WebSocketRelayClient, realmNumber: number);

        abstract usersJoined(client: WebSocketRelayClient, userNumbers: Array<number>, joinedBeforeYou: boolean);

        abstract userLeft(client: WebSocketRelayClient, userNumber: number);

        abstract childRealmCreated(client: WebSocketRelayClient, realmNumber: number);

        abstract childRealmDestroyed(client: WebSocketRelayClient, realmNumber: number);

        abstract handleCommand(client: WebSocketRelayClient, senderUserNumber: number, target: MessageTarget, command: string, parameters: string[]);

        public handleMessage(client: WebSocketRelayClient, senderUserNumber: number, target: MessageTarget, message: string) {
            var parts = CommandChannelHandler.decode(message);
            this.handleCommand(client, senderUserNumber, target, parts[0], parts.slice(1));
        }

        abstract handleData(client: WebSocketRelayClient, name: string, data: string);

        public static encode(...parts: Object[]): string {
            var result = '';
            var first = true;
            for (var i in parts) {
                var part = parts[i].toString();
                var fixedPart = part.replace('\\', '\\\\').replace('"', '\"');
                if (part.indexOf(' ') != -1 || part == '') {
                    fixedPart = '"' + part + '"';
                }
                if (first) { first = false; } else { result += ' '; }
                result += fixedPart;
            }
            return result;
        }

        public static decode(line: string): string[] {

            // A blank line contains no data at all
            if (line === '') return [];

            // Initialise some variables for the DFA-based state machine
            var result = [];
            var lexerState = 0;
            var currentPart = null;

            // Process every character in the line
            for (var i = 0; i < line.length; i++) {
                switch (lexerState) {
                    case 0:
                        // Lexer state 0 is the normal state
                        if (line[i] == ' ') {
                            result.push(currentPart);
                            currentPart = null;
                        }
                        else if (line[i] == '"') {
                            if (currentPart === null) currentPart = '';
                            lexerState = 1;
                        }
                        else {
                            if (currentPart === null) currentPart = '';
                            currentPart += line[i];
                        }
                        break;
                    case 1:
                        // Lexer state 1 is the quote-enclosed string state
                        if (line[i] == '"') { lexerState = 0; } else { currentPart += line[i]; }
                        break;
                }
            }

            // Return the parts (making sure to add the last part)
            result.push(currentPart);
            return result;
        }

    }

}