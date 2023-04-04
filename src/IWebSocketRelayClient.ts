module WSRelayClient {

    /**
     * A WebSocket Relay client, making it possible to communicate with a WebSocket Relay server.
     * In this module two implementations are defined: WebSocketRelayClient and OfflineWebSocketRelayClient.
     */
    export interface IWebSocketRelayClient {

        /**
         * Sends a request to the server to join a specific realm.
         * The server will respond with the realm number once the realm has been joined.
         * @param realmNumber The realm number to join.
         * @param type The type of realm to join (`0` = `realm`, a top-level realm or `1` = `childRealm`, a child realm).
         */
        joinRealm(realmNumber: number, type: RealmType): void;

        /**
         * Sends a request to the server to create a new realm of the specified type, and join it.
         * The server will respond with the realm number once the realm has been joined.
         * @param type The type of realm to create, (`0` = `realm`, a top-level realm or `1` = `childRealm`, a child realm).
         */
        createRealm(type: RealmType): void;

        /**
         * Sends a request to the server to send a message to a specific user in the current realm.
         * @param userNumber The user number of the user to send a message to, and they must be in the current realm.
         * @param message The message to send to the user.
         */
        sendToUser(userNumber: number, message: string): void;

        /**
         * Sends a request to the server to send a message to everyone in the current realm, and to make sure the messgae is not also sent to you.
         * @param message The message to send to everyone in the realm except the sender.
         */
        sendToAllExceptMe(message: string): void;

        /**
         * Sends a request to the server to send a message to everyone in the current realm.
         * @param message The message to send to everyone in the realm.
         */
        sendToAll(message: string): void;

        /**
         * Sends a request to the server to send a message to everyone in a specific realm, allowing cross-realm communication.
         * @param realmNumber The realm number to broadcast a message to.
         * @param message The message to send to that realm.
         */
        sendToRealm(realmNumber: number, message: string): void;

        /**
         * Saves data to the server, associating it with the current realm.
         * Other users can load this data at any time.
         * It is also possible to delete data via this command.
         * @param name The name of the data.
         * @param data The value of the data. Use empty string to delete the data.
         * @param duration The number of seconds the data will live for before being deleted, `0` to ensure it lives forever (or until it is intentionally deleted).
         */
        saveData(name: string, data: string, duration: number): void;

        /**
         * Sends a request to the server to load data associated with the specified name for the current realm (or the specified realm).
         * The server will respond with the value of the data via a client's `handleData()` method.
         * @param name The name of the data whose value you are asking for.
         * @param realmNumber The realm number the data belongs to, -1 to indicate the current realm.
         */
        loadData(name: string, realmNumber: number): void;

        /**
         * Sends a command to the server. Not all WebSocket Relay servers implement command functionality.
         * @param command The command to send to the server, defined on a server-by-server basis.
         */
        sendCommand(command: string): void;

        /**
         * Disconnects from the WebSocket Relay server. The `channelStatus()` method will be called on the handler to reflect the new connection status.
         */
        disconnect(): void;

    }

}