module WSRelayClient {

    export class WebSocketRelayClient {

        private webSocket: WebSocket = null;

        public handler: IChannelHandler = null;

        public constructor(address: string, protocol: string, handler: IChannelHandler) {
            this.handler = handler;
            this.webSocket = new WebSocket(address, protocol);
            this.webSocket.onopen = this.handleSocketOpen;
            this.webSocket.onclose = this.handleSocketClose;
            this.webSocket.onmessage = this.handleSocketMessage;
            this.webSocket.onerror = this.handleSocketError;
        }

        public joinRealm(realmNumber: number, type: RealmType) {
            if (type == RealmType.childRealm) {
                this.webSocket.send('&' + realmNumber);
            } else {
                this.webSocket.send('^' + realmNumber);
            }
        }

        public createRealm(type: RealmType) {
            if (type == RealmType.childRealm) {
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

        public sendToRealm(realmNumber: number, message: string) {
            this.webSocket.send(':' + realmNumber + ' ' + message);
        }

        public saveData(name: string, data: string) {
            this.webSocket.send('>' + name.replace(' ', '_') + ' ' + data);
        }

        public loadData(name: string) {
            this.webSocket.send('<' + name.replace(' ', '_'));
        }

        public disconnect() {
            if (this.webSocket !== null) {
                this.webSocket.close();
                this.webSocket = null;
            }
        }

        private handleSocketOpen = (e: Event) => {
            console.log('[WebSocket:Open]');
            this.handler.channelStatus(this, ChannelStatus.online);
        }

        private handleSocketClose = (e: CloseEvent) => {
            console.groupCollapsed('[WebSocket:Close] ' + e.code + ': "' + e.reason + '"');
            console.dir(e);
            console.groupEnd();
            this.handler.channelStatus(this, ChannelStatus.offline);
            this.webSocket = null;
        }

        private handleSocketError = (e: Event) => {
            console.groupCollapsed('[WebSocket:Error]');
            console.dir(e);
            console.groupEnd();
        }

        private handleSocketMessage = (e: MessageEvent) => {
            var line = <string>e.data;
            if (line.length == 0) return;
            console.log('[WebSocket:Message] ' + line);
            var spaceIndex = line.indexOf(' ');
            var protocolPart = spaceIndex >= 0 ? line.substring(0, spaceIndex) : line;
            var symbol = protocolPart.length > 0 ? protocolPart[0] : '';
            var messagePart = spaceIndex >= 0 ? line.substring(spaceIndex + 1) : '';
            switch (symbol) {

                case '#':
                    if (this.handler.assignUserNumber !== undefined) {
                        this.handler.assignUserNumber(this, parseInt(protocolPart.substring(1)));
                    }
                    break;

                case '^':
                case '&':
                    if (this.handler.assignRealmNumber !== undefined) {
                        this.handler.assignRealmNumber(this, parseInt(protocolPart.substring(1)));
                    }
                    break;

                case '=':
                    if (this.handler.usersJoined !== undefined) {
                        if (protocolPart.length > 1) {
                            var userNumbers: Array<number> = [];
                            for (var userNumberString of protocolPart.substring(1).split(',')) {
                                userNumbers.push(parseInt(userNumberString));
                            }
                            this.handler.usersJoined(this, userNumbers, true);
                        }
                    }
                    break;

                case '+':
                    if (this.handler.usersJoined !== undefined) {
                        this.handler.usersJoined(this, [parseInt(protocolPart.substring(1))], false);
                    }
                    break;

                case '-':
                    if (this.handler.userLeft !== undefined) {
                        this.handler.userLeft(this, parseInt(protocolPart.substring(1)));
                    }
                    break;

                case '{':
                    if (this.handler.childRealmCreated !== undefined) {
                        this.handler.childRealmCreated(this, parseInt(protocolPart.substring(1)));
                    }
                    break;

                case '}':
                    if (this.handler.childRealmDestroyed !== undefined) {
                        this.handler.childRealmDestroyed(this, parseInt(protocolPart.substring(1)));
                    }
                    break;

                case '@':
                    if (this.handler.handleMessage !== undefined) {
                        this.handler.handleMessage(this, parseInt(protocolPart.substring(1)), MessageTarget.me, messagePart);
                    }
                    break;

                case '!':
                    if (this.handler.handleMessage !== undefined) {
                        this.handler.handleMessage(this, parseInt(protocolPart.substring(1)), MessageTarget.allExceptSender, messagePart);
                    }
                    break;

                case '*':
                    if (this.handler.handleMessage !== undefined) {
                        this.handler.handleMessage(this, parseInt(protocolPart.substring(1)), MessageTarget.all, messagePart);
                    }
                    break;

                case '<':
                    if (this.handler.handleData !== undefined) {
                        var name = protocolPart.substring(1);
                        this.handler.handleData(this, name, messagePart);
                    }
                    break;
            }
        }

    }

}