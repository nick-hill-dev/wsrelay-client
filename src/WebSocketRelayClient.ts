﻿module WSRelayClient {

    /**
     * A standard implementation of `IWebSocketRelayClient` for communicating with a WebSocket Relay server
     * and handling communications from a WebSocket relay server.
     */
    export class WebSocketRelayClient implements IWebSocketRelayClient {

        private webSocket: WebSocket = null;

        public handler: IChannelHandler = null;

        public userNumber: number = -1;

        public realmNumber: number = -1;

        /**
         * @param address The address to connect to, for example ws://127.0.0.1 or wss:/127.0.0.1. Can also include a port number.
         * @param protocol The protocol to use, which is part of the websocket specification, and it must be accepted by the WebSocket Relay server.
         * @param handler The channel handler to use when handling messages sent by the WebSocket Relay server.
         * @param log Indicates what messages to automatically log as a result of sending and/or receiving messages between the client and the server.
         */
        public constructor(
            address: string,
            protocol: string,
            handler: IChannelHandler,
            private readonly log: LogType = LogType.none
        ) {
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
            if (this.log) {
                console.log('[WebSocket:Out] @' + userNumber + ' ' + message);
            }
            this.webSocket.send('@' + userNumber + ' ' + message);
        }

        public sendToAllExceptMe(message: string) {
            if (this.log) {
                console.log('[WebSocket:Out] !' + message);
            }
            this.webSocket.send('! ' + message);
        }

        public sendToAll(message: string) {
            if (this.log) {
                console.log('[WebSocket:Out] *' + message);
            }
            this.webSocket.send('* ' + message);
        }

        public sendToRealm(realmNumber: number, message: string) {
            if (this.log) {
                console.log('[WebSocket:Out] :' + realmNumber + ' ' + message);
            }
            this.webSocket.send(':' + realmNumber + ' ' + message);
        }

        public saveData(name: string, data: string, duration: number = 0) {
            if (this.log) {
                console.log('[WebSocket:Out] >' + name + ' ' + data);
            }
            let protocol = '>' + name.replace(' ', '_').replace(',', '_');
            if (duration > 0) {
                protocol += ',' + duration;
            }
            this.webSocket.send(protocol + ' ' + data);
        }

        public loadData(name: string, realmNumber: number = -1) {
            if (this.log) {
                console.log('[WebSocket:Out] <' + name);
            }
            let text = '<';
            if (realmNumber != -1) {
                text += realmNumber + ',';
            }
            text += name.replace(' ', '_').replace(',', '_');
            this.webSocket.send(text);
        }

        public sendCommand(command: string) {
            this.webSocket.send('$' + command);
        }

        public disconnect() {
            if (this.webSocket !== null) {
                this.webSocket.close();
                this.webSocket = null;
            }
        }

        private handleSocketOpen = (e: Event) => {
            if (this.log) {
                console.log('[WebSocket:Open]');
            }
            this.handler.channelStatus(this, ChannelStatus.online);
        }

        private handleSocketClose = (e: CloseEvent) => {
            if (this.log) {
                console.groupCollapsed('[WebSocket:Close] ' + e.code + ': "' + e.reason + '"');
                console.dir(e);
                console.groupEnd();
            }
            this.handler.channelStatus(this, ChannelStatus.offline);
            this.webSocket = null;
        }

        private handleSocketError = (e: Event) => {
            if (this.log) {
                console.groupCollapsed('[WebSocket:Error]');
                console.dir(e);
                console.groupEnd();
            }
        }

        private handleSocketMessage = (e: MessageEvent) => {
            let line = <string>e.data;
            if (line.length == 0) {
                return;
            }
            if (this.log) {
                console.log('[WebSocket:In] ' + line);
            }
            let spaceIndex = line.indexOf(' ');
            let protocolPart = spaceIndex >= 0 ? line.substring(0, spaceIndex) : line;
            let symbol = protocolPart.length > 0 ? protocolPart[0] : '';
            let messagePart = spaceIndex >= 0 ? line.substring(spaceIndex + 1) : '';
            switch (symbol) {

                case '#':
                    this.userNumber = parseInt(protocolPart.substring(1));
                    if (this.handler.assignUserNumber !== undefined) {
                        this.handler.assignUserNumber(this, this.userNumber);
                    }
                    break;

                case '^':
                case '&':
                    this.realmNumber = parseInt(protocolPart.substring(1));
                    if (this.handler.assignRealmNumber !== undefined) {
                        this.handler.assignRealmNumber(this, this.realmNumber);
                    }
                    break;

                case '=':
                    if (this.handler.usersJoined !== undefined) {
                        let userNumbers: number[] = [];
                        if (protocolPart.length > 1) {
                            for (let userNumberString of protocolPart.substring(1).split(',')) {
                                userNumbers.push(parseInt(userNumberString));
                            }
                        }
                        this.handler.usersJoined(this, userNumbers, true);
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
                        let realmNumber = this.realmNumber;
                        let name = protocolPart.substring(1);
                        let index = name.indexOf(',');
                        if (index != -1) {
                            realmNumber = parseInt(name.substring(0, index));
                            name = name.substring(index + 1);
                        }
                        this.handler.handleData(this, realmNumber, name, messagePart);
                    }
                    break;
            }
        }

    }

}