module WSRelayClient {

    export abstract class CommandChannelHandler implements IChannelHandler {

        abstract channelStatus(client: WebSocketRelayClient, status: ChannelStatus): void;

        abstract assignUserNumber?(client: WebSocketRelayClient, userNumber: number): void;

        abstract assignRealmNumber?(client: WebSocketRelayClient, realmNumber: number): void;

        abstract usersJoined?(client: WebSocketRelayClient, userNumbers: number[], joinedBeforeYou: boolean): void;

        abstract userLeft?(client: WebSocketRelayClient, userNumber: number): void;

        abstract childRealmCreated?(client: WebSocketRelayClient, realmNumber: number): void;

        abstract childRealmDestroyed?(client: WebSocketRelayClient, realmNumber: number): void;

        abstract handleCommand?(client: WebSocketRelayClient, senderUserNumber: number, target: MessageTarget, command: string, parameters: string[]): void;

        public handleMessage(client: WebSocketRelayClient, senderUserNumber: number, target: MessageTarget, message: string) {
            var parts = Command.decode(message);
            if (this.handleCommand !== undefined) {
                this.handleCommand(client, senderUserNumber, target, parts[0], parts.slice(1));
            }
        }

        abstract handleData?(client: WebSocketRelayClient, realmNumber: number, name: string, data: string): void;

    }

}