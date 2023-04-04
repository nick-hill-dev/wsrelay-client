module WSRelayClient {

    /**
     * Contains various options for configuring the `OfflineWebSocketRelayClient`.
     */
    export class OfflineOptions {

        /** 
         * The "ping time", emulating delay between the server and the client.
         */
        public pingTime: number = 50;

        /**
         * Indicates whether or not to save data to local storage when calling `saveData()` on the client.
         * This ensures the data is persisted, otherwise data is lost when the client is lost.
         */
        public saveDataToLocalStorage: boolean = false;

    }

}