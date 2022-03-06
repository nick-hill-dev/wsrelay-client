module WSRelayClient {

    export class ChannelFrame {

        public constructor(
            public readonly type: ChannelFrameType,
            public readonly id: number,
            public readonly command: string,
            public readonly parameters: string[]
        ) {
        }
    
    }

}