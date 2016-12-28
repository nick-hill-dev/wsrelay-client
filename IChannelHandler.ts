module WSRelayClient {

    export interface IChannelHandler {

        channelStatus(client: WebSocketRelayClient, online: boolean);

        assignUserNumber(client: WebSocketRelayClient, userNumber: number);

        assignRealmNumber(client: WebSocketRelayClient, realmNumber: number);

        usersJoined(client: WebSocketRelayClient, userNumbers: Array<number>, joinedBeforeYou: boolean);

        userLeft(client: WebSocketRelayClient, userNumber: number);

        childRealmCreated(client: WebSocketRelayClient, realmNumber: number);

        childRealmDestroyed(client: WebSocketRelayClient, realmNumber: number);

        handleMessageToAll(client: WebSocketRelayClient, senderUserNumber: number, includeSender: boolean, message: string);

        handleMessageToMe(client: WebSocketRelayClient, senderUserNumber: number, message: string);

    }

}