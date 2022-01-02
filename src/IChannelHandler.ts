module WSRelayClient {

    export interface IChannelHandler {

        channelStatus(client: IWebSocketRelayClient, status: ChannelStatus): void;

        assignUserNumber?(client: IWebSocketRelayClient, userNumber: number): void;

        assignRealmNumber?(client: IWebSocketRelayClient, realmNumber: number): void;

        usersJoined?(client: IWebSocketRelayClient, userNumbers: Array<number>, joinedBeforeYou: boolean): void;

        userLeft?(client: IWebSocketRelayClient, userNumber: number): void;

        childRealmCreated?(client: IWebSocketRelayClient, realmNumber: number): void;

        childRealmDestroyed?(client: IWebSocketRelayClient, realmNumber: number): void;

        handleMessage?(client: IWebSocketRelayClient, senderUserNumber: number, target: MessageTarget, message: string): void;

        handleData?(client: IWebSocketRelayClient, realmNumber: number, name: string, data: string): void;

    }

}