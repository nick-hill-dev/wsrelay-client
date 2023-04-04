module WSRelayClient {

    /**
     * A WebSocket Relay client channel handler based around the concept of parameterized commands being sent and received rather than simply strings.
     * This class implements some aspects of the `IChannelHandler` interface, leaving the rest for you to implement.
     * This class removes the `handleMessage` function and replaces it with the more useful `handleCommand` function, which gives you the command and the parameters associated with it.
     * To send commands to other members of a realm use `client.sendToX()`, encoding messages via `Command.encode()`.
     */
    export abstract class CommandChannelHandler implements IChannelHandler {

        abstract channelStatus(client: WebSocketRelayClient, status: ChannelStatus): void;

        abstract assignUserNumber?(client: WebSocketRelayClient, userNumber: number): void;

        abstract assignRealmNumber?(client: WebSocketRelayClient, realmNumber: number): void;

        abstract usersJoined?(client: WebSocketRelayClient, userNumbers: number[], joinedBeforeYou: boolean): void;

        abstract userLeft?(client: WebSocketRelayClient, userNumber: number): void;

        abstract childRealmCreated?(client: WebSocketRelayClient, realmNumber: number): void;

        abstract childRealmDestroyed?(client: WebSocketRelayClient, realmNumber: number): void;

        /**
         * Called when someone sends a command (with optional parameters) to a group of people in the realm, and you are one of the recipients of that command.
         * @param client A WebSocket Relay client, which can be used to join or manage realms, send messages to other users, save or load data...etc.
         * @param senderUserNumber The user number of the user who sent the command.
         * @param target The intended target for this command (`0` = `all`, `1` = `allExceptSender`, `2` = `me`).
         * @param command The command, a single string identifying a single action or request with optional parameters in `parameters`.
         * @param parameters The parameters associated with the specified `command`.
         */
        abstract handleCommand?(client: WebSocketRelayClient, senderUserNumber: number, target: MessageTarget, command: string, parameters: string[]): void;

        public handleMessage(client: WebSocketRelayClient, senderUserNumber: number, target: MessageTarget, message: string) {
            let parts = Command.decode(message);
            if (this.handleCommand !== undefined) {
                this.handleCommand(client, senderUserNumber, target, parts[0], parts.slice(1));
            }
        }

        abstract handleData?(client: WebSocketRelayClient, realmNumber: number, name: string, data: string): void;

    }

}