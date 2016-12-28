module WSRelayClient {

    export class WebSocketRelayClient {

        private webSocket: WebSocket = null;

        public handler: IChannelHandler = null;

        public constructor(address: string, protocol: string, handler: IChannelHandler) {
            this.handler = handler;
            this.webSocket = new WebSocket(address, protocol);
            this.webSocket.onopen = (e: Event) => this.handleSocketOpen(e);
            this.webSocket.onclose = (e: CloseEvent) => this.handleSocketClose(e);
            this.webSocket.onmessage = (e: MessageEvent) => this.handleSocketMessage(e);
            this.webSocket.onerror = (e: Event) => this.handleSocketError(e);
        }

        public joinRealm(realmNumber: number, createChildRealm: boolean) {
            if (createChildRealm) {
                this.webSocket.send('&' + realmNumber);
            } else {
                this.webSocket.send('^' + realmNumber);
            }
        }

        public createRealm(createChildRealm: boolean) {
            if (createChildRealm) {
                this.webSocket.send('&');
            } else {
                this.webSocket.send('^');
            }
        }

        public sendToUser(userNumber: number, message: string) {
            this.webSocket.send('@' + userNumber + ' ' + message);
        }

        public sendToAllExceptMe(message: string) {
            this.webSocket.send('! ' + message);
        }

        public sendToAll(message: string) {
            this.webSocket.send('* ' + message);
        }

        public disconnect() {
            if (this.webSocket !== null) {
                this.webSocket.close();
                this.webSocket = null;
            }
        }

        private handleSocketOpen(e: Event) {
            console.log('[WebSocket:Open]');
            this.handler.channelStatus(this, true);
        }

        private handleSocketClose(e: CloseEvent) {
            console.log('[WebSocket:Close] ' + e.code + ': "' + e.reason + '"');
            this.handler.channelStatus(this, false);
            this.webSocket = null;
        }

        private handleSocketError(e: Event) {
            console.log('[WebSocket:Error]');
            this.handler.channelStatus(this, false);
        }

        private handleSocketMessage(e: MessageEvent) {
            var line = <string>e.data;
            if (line.length == 0) return;
            console.log('[WebSocket:Message] ' + line);
            var spaceIndex = line.indexOf(' ');
            var protocolPart = spaceIndex >= 0 ? line.substring(0, spaceIndex - 1) : line;
            var symbol = protocolPart.length > 0 ? protocolPart[0] : '';
            var messagePart = spaceIndex >= 0 ? line.substring(spaceIndex + 1) : '';
            switch (symbol) {

                case '#':
                    this.handler.assignUserNumber(this, parseInt(protocolPart.substring(1)));
                    break;

                case '^':
                case '&':
                    this.handler.assignRealmNumber(this, parseInt(protocolPart.substring(1)));
                    break;

                case '=':
                    if (protocolPart.length > 1) {
                        var userNumbers: Array<number> = [];
                        for (var userNumberString of protocolPart.substring(1).split(',')) {
                            userNumbers.push(parseInt(userNumberString));
                        }
                        this.handler.usersJoined(this, userNumbers, true);
                    }
                    break;

                case '+':
                    this.handler.usersJoined(this, [parseInt(protocolPart.substring(1))], false);
                    break;

                case '-':
                    var parts = protocolPart.substring(1).split(',');
                    this.handler.userLeft(this, parseInt(protocolPart.substring(1)));
                    break;

                case '{':
                    this.handler.childRealmCreated(this, parseInt(protocolPart.substring(1)));
                    break;

                case '}':
                    this.handler.childRealmDestroyed(this, parseInt(protocolPart.substring(1)));
                    break;

                case '@':
                    this.handler.handleMessageToMe(this, parseInt(protocolPart.substring(1)), messagePart);
                    break;

                case '!':
                    this.handler.handleMessageToAll(this, parseInt(protocolPart.substring(1)), false, messagePart);
                    break;

                case '*':
                    this.handler.handleMessageToAll(this, parseInt(protocolPart.substring(1)), true, messagePart);
                    break;
            }
        }

    }

}