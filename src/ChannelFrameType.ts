module WSRelayClient {

    export enum ChannelFrameType {
        join,
        leave,
        message,
        isHost,
        isNewHost,
        negotiated,
        offline
    }

}