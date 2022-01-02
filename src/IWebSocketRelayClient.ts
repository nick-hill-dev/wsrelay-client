module WSRelayClient {

    export interface IWebSocketRelayClient {

        joinRealm(realmNumber: number, type: RealmType): void;

        createRealm(type: RealmType): void;

        sendToUser(userNumber: number, message: string): void;

        sendToAllExceptMe(message: string): void;

        sendToAll(message: string): void;

        sendToRealm(realmNumber: number, message: string): void;

        saveData(name: string, data: string, duration: number): void;

        loadData(name: string, realmNumber: number): void;

        sendCommand(command: string): void;

        disconnect(): void;

    }

}