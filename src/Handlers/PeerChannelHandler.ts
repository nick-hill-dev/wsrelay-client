module WSRelayClient {

    /**
     * An experimental peer to peer channel handler client for the WebSocket Relay server.
     * A `PeerChannelHandler` might be useful for frame-based multiplayer games with self-organizing host management, where a single
     * user is designated as the host for a realm and handles all of the commands without need for a centralized server.
     * The host is automatically managed and the handler is able to automatically handle when users join and leave, even if the host leaves.
     * That said, this is an experimental class which has not been thoroughly proven yet.
     * Regularly call 'getNextFrame' to gather a list of unprocessed messages, for processing. This is the primary mechanism for determining what has
     * happened and what needs to be processed.
     */
    export class PeerChannelHandler implements IChannelHandler {

        public hostUserNumber: number = -1;

        public myUserNumber: number = -1;

        private frames: ChannelFrame[] = [];

        private userNumbers: number[] = [];

        private realmNumber: number = -1;

        private childRealmNumbers: number[] = [];

        private realmResponseCount: number = 0;

        private completedAllNegotiation: boolean = false;

        public constructor(private readonly options: RealmOptions) {
        }

        public amIHost(): boolean {
            return this.myUserNumber !== -1 && this.myUserNumber === this.hostUserNumber;
        }

        public getNextFrame(): ChannelFrame {
            return this.frames.length == 0 ? null : this.frames.shift();
        }

        public channelStatus(client: WebSocketRelayClient, status: ChannelStatus) {
            if (status == ChannelStatus.online) {
                client.joinRealm(this.options.realmNumber, WSRelayClient.RealmType.realm);
            } else {
                this.queueFrame(ChannelFrameType.offline);
            }
        }

        public assignUserNumber(client: WebSocketRelayClient, userNumber: number) {
            this.userNumbers.push(userNumber);
            this.myUserNumber = userNumber;
        }

        public assignRealmNumber(client: WebSocketRelayClient, realmNumber: number) {
            this.realmNumber = realmNumber;
        }

        public usersJoined(client: WebSocketRelayClient, userNumbers: number[], joinedBeforeYou: boolean) {

            if (this.inTargetRealm()) {
                if (joinedBeforeYou) {
                    this.queueFrame(ChannelFrameType.join, this.myUserNumber);
                }
                for (let userNumber of userNumbers) {
                    this.userNumbers.push(userNumber);
                    this.queueFrame(ChannelFrameType.join, userNumber);
                }
            }

            // At this point we also have a complete picture of all existing child realms
            if (joinedBeforeYou) {
                if (this.options.childRealm != null) {
                    if (this.realmNumber == this.options.realmNumber) {
                        this.beginDetermineRealm(client);
                    } else {
                        this.endDetermineRealm(client);
                    }
                } else {
                    this.endDetermineRealm(client);
                }
            }
        }

        public userLeft(client: WebSocketRelayClient, userNumber: number) {
            if (!this.inTargetRealm()) {
                return;
            }
            this.userNumbers.splice(this.userNumbers.indexOf(userNumber), 1);
            this.queueFrame(ChannelFrameType.leave, userNumber);
            if (userNumber == this.hostUserNumber) {
                this.hostUserNumber = Math.min(...this.userNumbers);
                this.queueFrame(ChannelFrameType.isNewHost, this.hostUserNumber);
            }
        }

        public childRealmCreated(client: WebSocketRelayClient, realmNumber: number) {
            this.childRealmNumbers.push(realmNumber);
        }

        public childRealmDestroyed(client: WebSocketRelayClient, realmNumber: number) {
            this.childRealmNumbers.splice(this.childRealmNumbers.indexOf(realmNumber), 1);
        }

        public handleMessage(client: WebSocketRelayClient, senderUserNumber: number, target: MessageTarget, message: string) {
            let parts = Command.decode(message);
            let command = parts[0];
            let parameters = parts.slice(1);
            let hostIsMe = this.hostUserNumber != -1 && this.hostUserNumber == this.myUserNumber;

            switch (command) {
                case 'GET_REALM_INFO':
                    if (hostIsMe) {
                        client.sendToUser(senderUserNumber, Command.encode('REALM_INFO', this.realmNumber.toString(), this.userNumbers.length.toString()));
                    }
                    break;

                case 'REALM_INFO':
                    this.considerRealm(client, parseInt(parameters[0]), parseInt(parameters[1]));
                    break;

                case 'WHO_IS_HOST':
                    if (hostIsMe) {
                        client.sendToUser(senderUserNumber, 'I_AM_HOST');
                    }
                    break;

                case 'I_AM_HOST':
                    this.endDetermineHost(senderUserNumber);
                    break;

                default:
                    if (this.completedAllNegotiation) {
                        this.queueFrame(ChannelFrameType.message, senderUserNumber, command, parameters);
                    }
            }
        }

        public handleData(client: WebSocketRelayClient, realmNumber: number, name: string, data: string) {
            if (this.completedAllNegotiation) {
                this.queueFrame(ChannelFrameType.data, -1, name, [data]);
            }
        }

        private beginDetermineRealm(client: WebSocketRelayClient) {
            if (this.childRealmNumbers.length == 0) {
                client.createRealm(RealmType.childRealm);
            } else {
                for (let realmNumber of this.childRealmNumbers) {
                    client.sendToRealm(realmNumber, 'GET_REALM_INFO');
                }
            }
        }

        private considerRealm(client: WebSocketRelayClient, realmNumber: number, userCount: number) {
            this.realmResponseCount++;
            if (userCount < this.options.childRealm.capacity) {
                client.joinRealm(realmNumber, RealmType.childRealm);
            } else if (this.realmResponseCount == this.childRealmNumbers.length) {
                client.createRealm(RealmType.childRealm);
            }
        }

        private endDetermineRealm(client: WebSocketRelayClient) {
            this.beginDetermineHost(client);
        }

        private beginDetermineHost(client: WebSocketRelayClient) {
            if (this.userNumbers.length == 1) {
                this.endDetermineHost(this.myUserNumber);
            } else if (this.userNumbers.length == 2) {
                let hostID = this.userNumbers[0] == this.myUserNumber ? this.userNumbers[1] : this.userNumbers[0];
                this.endDetermineHost(hostID);
            } else {
                client.sendToAllExceptMe('WHO_IS_HOST');
            }
        }

        private endDetermineHost(hostID: number) {
            this.hostUserNumber = hostID;
            this.queueFrame(ChannelFrameType.isHost, this.hostUserNumber);
            this.queueFrame(ChannelFrameType.negotiated);
            this.completedAllNegotiation = true;
        }

        private queueFrame(type: ChannelFrameType, id: number = -1, command: string = null, parameters: string[] = null) {
            this.frames.push(new ChannelFrame(type, id, command, parameters));
        }

        private inTargetRealm(): boolean {
            return this.options.childRealm == null || this.realmNumber != this.options.realmNumber;
        }

    }

}