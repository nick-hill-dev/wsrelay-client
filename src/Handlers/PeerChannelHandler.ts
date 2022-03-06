module WSRelayClient {

    export class PeerChannelHandler implements IChannelHandler {

        public hostUserNumber: number = -1;

        public myUserNumber: number = -1;

        private frames: ChannelFrame[] = [];

        private userNumbers: number[] = [];

        private negotiationComplete: boolean = false;

        public constructor(private readonly realmNumber: number) {
        }

        public getNextFrame(): ChannelFrame {
            return this.frames.length == 0 ? null : this.frames.shift();
        }

        public channelStatus(client: WebSocketRelayClient, status: ChannelStatus) {
            if (status == ChannelStatus.online) {
                client.joinRealm(this.realmNumber, WSRelayClient.RealmType.realm);
            } else {
                this.queueFrame(ChannelFrameType.offline);
            }
        }

        public assignUserNumber?(client: WebSocketRelayClient, userNumber: number) {
            this.userNumbers.push(userNumber);
            this.myUserNumber = userNumber;
        }

        public assignRealmNumber?(client: WebSocketRelayClient, realmNumber: number) {
        }

        public usersJoined?(client: WebSocketRelayClient, userNumbers: number[], joinedBeforeYou: boolean) {

            if (joinedBeforeYou) {
                if (userNumbers.length < 2) {
                    this.hostUserNumber = userNumbers.length == 0 ? this.myUserNumber : userNumbers[0];
                    this.queueFrame(ChannelFrameType.isHost, this.hostUserNumber);
                    this.queueFrame(ChannelFrameType.negotiated);
                    this.negotiationComplete = true;
                } else {
                    client.sendToAllExceptMe('WHO_IS_HOST');
                }
            }

            this.queueFrame(ChannelFrameType.join, this.myUserNumber);
            for (let userNumber of userNumbers) {
                this.userNumbers.push(userNumber);
                this.queueFrame(ChannelFrameType.join, userNumber);
            }
        }

        public userLeft?(client: WebSocketRelayClient, userNumber: number) {
            this.userNumbers.splice(this.userNumbers.indexOf(userNumber), 1);
            this.queueFrame(ChannelFrameType.leave, userNumber);
            if (userNumber == this.hostUserNumber) {
                this.hostUserNumber = Math.min(...this.userNumbers);
                this.queueFrame(ChannelFrameType.isNewHost, this.hostUserNumber);
            }
        }

        public childRealmCreated?(client: WebSocketRelayClient, realmNumber: number) {
        }

        public childRealmDestroyed?(client: WebSocketRelayClient, realmNumber: number) {
        }

        public handleMessage(client: WebSocketRelayClient, senderUserNumber: number, target: MessageTarget, message: string) {
            let parts = Command.decode(message);
            let command = parts[0];
            let parameters = parts.slice(1);

            switch (command) {
                case 'WHO_IS_HOST':
                    if (this.hostUserNumber != -1 && this.hostUserNumber == this.myUserNumber) {
                        client.sendToUser(senderUserNumber, 'I_AM_HOST');
                    }
                    break;

                case 'I_AM_HOST':
                    this.hostUserNumber = senderUserNumber;
                    this.queueFrame(ChannelFrameType.isHost, this.hostUserNumber);
                    this.queueFrame(ChannelFrameType.negotiated);
                    this.negotiationComplete = true;
                    break;

                default:
                    if (this.negotiationComplete) {
                        this.queueFrame(ChannelFrameType.message, senderUserNumber, command, parameters);
                    }
            }
        }

        public handleData?(client: WebSocketRelayClient, realmNumber: number, name: string, data: string) {
        }

        private queueFrame(type: ChannelFrameType, id: number = -1, command: string = null, parameters: string[] = null) {
            this.frames.push(new ChannelFrame(type, id, command, parameters));
        }

    }

}