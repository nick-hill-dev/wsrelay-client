module WSRelayClient {

    /**
     * A WebSocket Relay client that does not actually communicate with a WebSocket Relay server.
     * Useful for testing and debugging purposes without requiring an actual connection to the server.
     */
    export class OfflineWebSocketRelayClient implements IWebSocketRelayClient {

        public readonly userNumber: number = 1;

        public realmNumber: number = -1;

        private data: Array<{ realm: number; name: string; value: string }> = [];

        /**
         * @param handler The channel handler you wish to use for this client.
         * @param options Various options for configuring the offline server.
         */
        public constructor(public readonly handler: IChannelHandler, private readonly options: OfflineOptions) {
            if (this.options.saveDataToLocalStorage) {
                let jsonString = localStorage.getItem('webSocketRelayClientData');
                if (jsonString != null) {
                    this.data = JSON.parse(jsonString);
                }
            }
            if (this.handler.channelStatus !== undefined) {
                setTimeout(() => {
                    this.handler.channelStatus(this, ChannelStatus.online);
                }, this.options.pingTime);
            }
        }

        public joinRealm(realmNumber: number, type: RealmType) {
            this.realmNumber = type == RealmType.realm ? realmNumber : realmNumber + 1;
            if (this.handler.assignRealmNumber !== undefined) {
                setTimeout(() => {
                    this.handler.assignRealmNumber(this, this.realmNumber);
                }, this.options.pingTime);
            }
        }

        public createRealm(type: RealmType) {
            this.realmNumber++;
            if (this.handler.assignRealmNumber !== undefined) {
                setTimeout(() => {
                    this.handler.assignRealmNumber(this, this.realmNumber);
                }, this.options.pingTime);
            }
        }

        public sendToUser(userNumber: number, message: string) {
            if (userNumber == this.userNumber) {
                if (this.handler.handleMessage !== undefined) {
                    setTimeout(() => {
                        this.handler.handleMessage(this, userNumber, MessageTarget.me, message);
                    }, this.options.pingTime);
                }
            }
        }

        public sendToAllExceptMe(message: string) {
        }

        public sendToAll(message: string) {
            if (this.handler.handleMessage !== undefined) {
                setTimeout(() => {
                    this.handler.handleMessage(this, this.userNumber, MessageTarget.all, message);
                }, this.options.pingTime);
            }
        }

        public sendToRealm(realmNumber: number, message: string) {
            if (realmNumber == this.realmNumber) {
                if (this.handler.handleMessage !== undefined) {
                    setTimeout(() => {
                        this.handler.handleMessage(this, this.userNumber, MessageTarget.all, message);
                    }, this.options.pingTime);
                }
            }
        }

        public saveData(name: string, data: string, duration: number = 0) {
            let actualName = name.replace(' ', '_').replace(',', '_');
            this.deleteData(this.realmNumber, actualName);
            if (data != null && data != '') {
                this.data.push({ realm: this.realmNumber, name: actualName, value: data });
            }
            if (this.options.saveDataToLocalStorage) {
                localStorage.setItem('webSocketRelayClientData', JSON.stringify(this.data));
            }
        }

        public loadData(name: string, realmNumber: number = -1) {
            if (realmNumber == -1) {
                realmNumber = this.realmNumber;
            }
            let result = '';
            let actualName = name.replace(' ', '_').replace(',', '_');
            for (let dataEntry of this.data) {
                if (realmNumber == dataEntry.realm && actualName == dataEntry.name) {
                    result = dataEntry.value;
                }
            }
            if (this.handler.handleData !== undefined) {
                setTimeout(() => {
                    this.handler.handleData(this, realmNumber, actualName, result);
                }, this.options.pingTime);
            }
        }

        public sendCommand(command: string) {
        }

        public disconnect() {
            if (this.handler.channelStatus !== undefined) {
                setTimeout(() => {
                    this.handler.channelStatus(this, ChannelStatus.offline);
                }, this.options.pingTime);
            }
        }

        private deleteData(realmNumber: number, name: string) {
            for (let i = this.data.length - 1; i >= 0; i--) {
                let entry = this.data[i];
                if (entry.realm == realmNumber && entry.name == name) {
                    this.data.splice(i, 1);
                }
            }
        }

    }

}