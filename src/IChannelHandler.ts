module WSRelayClient {

    /**
     * A channel handler for the WebSocket Relay protocol.
     * Implement this interface to define behaviour for your handling of one or more WebSocket Relay realms.
     */
    export interface IChannelHandler {

        /**
         * Called when the channel status has changed, either to go offline or to indicate that it is online (and has been successfully connected to).
         * @param client A WebSocket Relay client, which can be used to join or manage realms, send messages to other users, save or load data...etc.
         * @param status The realm status (`0` = `online`, `1` = `offline`).
         */
        channelStatus(client: IWebSocketRelayClient, status: ChannelStatus): void;

        /**
         * Called when your user number has been determined so that you can keep track of which number is you.
         * At the time your user number has been specified, you are not a member of any realm.
         * It is often a good idea to join a realm now, via the `client.joinRealm()` command or something similar.
         * @param client A WebSocket Relay client, which can be used to join or manage realms, send messages to other users, save or load data...etc.
         * @param userNumber The user number that you have been assigned by the server. Keep track of this, because anything associated with this number means it is you that it associated with it.
         */
        assignUserNumber?(client: IWebSocketRelayClient, userNumber: number): void;

        /**
         * Called when your realm has changed, indicating which realm you are now currently connected to.
         * @param client A WebSocket Relay client, which can be used to join or manage realms, send messages to other users, save or load data...etc.
         * @param realmNumber The realm number that you have been assigned by the server (almost certainly because you asked to move realms). Keep track of this, because anything associated with this number means it is relevant to the realm you are now in.
         */
        assignRealmNumber?(client: IWebSocketRelayClient, realmNumber: number): void;

        /**
         * Called when users have joined your current realm, or when you are getting a list of users in the realm you have connected to.
         * @param client A WebSocket Relay client, which can be used to join or manage realms, send messages to other users, save or load data...etc.
         * @param userNumbers A list of users which have joined this realm. If `joinedBeforeYou` is `true` then the list you are being given is simply a list of people who are already present in the realm when you joined it.
         * @param joinedBeforeYou Indicates whether or not this list of users is simply a list of users who were already in the realm when you joined it. Otherwise, it is an announcement that someone has just joined the realm.
         */
        usersJoined?(client: IWebSocketRelayClient, userNumbers: number[], joinedBeforeYou: boolean): void;

        /**
         * Called when a user has left the realm you are currently connected to.
         * @param client A WebSocket Relay client, which can be used to join or manage realms, send messages to other users, save or load data...etc.
         * @param userNumber The user number of the user who has just left this realm.
         */
        userLeft?(client: IWebSocketRelayClient, userNumber: number): void;

        /**
         * Called when a child realm is created whose parent is your current realm.
         * @param client A WebSocket Relay client, which can be used to join or manage realms, send messages to other users, save or load data...etc.
         * @param realmNumber The realm number of the realm which has just been created as a child realm of your current realm.
         */
        childRealmCreated?(client: IWebSocketRelayClient, realmNumber: number): void;

        /**
         * Called when a child realm is deleted, when the parent of that realm is your current realm.
         * @param client A WebSocket Relay client, which can be used to join or manage realms, send messages to other users, save or load data...etc.
         * @param realmNumber The realm number of the realm which has been deleted, which was a child realm of your current realm.
         */
        childRealmDestroyed?(client: IWebSocketRelayClient, realmNumber: number): void;

        /**
         * Called when someone sends a message to a group of people in the realm, and you are one of the recipients of that message.
         * @param client A WebSocket Relay client, which can be used to join or manage realms, send messages to other users, save or load data...etc.
         * @param senderUserNumber The user number of the user who has sent the message.
         * @param target The intended target for this message (`0` = `all`, `1` = `allExceptSender`, `2` = `me`).
         * @param message The message sent by the user.
         */
        handleMessage?(client: IWebSocketRelayClient, senderUserNumber: number, target: MessageTarget, message: string): void;

        /**
         * Called when the server sends you data, often as a result of a call to `client.loadData()`.
         * @param client A WebSocket Relay client, which can be used to join or manage realms, send messages to other users, save or load data...etc.
         * @param realmNumber The realm number the data is associated with, useful for tracking cross-realm data responses.
         * @param name The name of the data.
         * @param data The value of the data.
         */
        handleData?(client: IWebSocketRelayClient, realmNumber: number, name: string, data: string): void;

    }

}