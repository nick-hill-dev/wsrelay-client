module WSRelayClient {

    export enum ChannelFrameType {
        join,
        leave,
        data,
        message,
        isHost,
        isNewHost,
        negotiated,
        offline
    }

}