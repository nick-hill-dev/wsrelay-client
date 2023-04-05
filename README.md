# WebSocket Relay Client

The WebSocket Relay client is a Javascript library that simplifies the process of communicating with a WebSocket Relay server and makes it easy to create an internet communications application where users of different web browsers and/or different computers can seamlessly communicate with one another via the relay server, providing the illusion that they are in fact connected to each other.

Web pages that make use of a WebSocket Relay server must understand and transmit messages using the [WebSocket Relay protocol](https://github.com/nick-hill-dev/wsrelay-server/blob/master/PROTOCOL.md). This library simplifies the protocol significantly to the point that all that is needed is to implement the `IChannelHandler` interface and make use of an instance of the `IWebSocketRelayClient` interface (for example, the class `WebSocketRelayClient`).

Reference the [WebSocket Relay Server](https://github.com/nick-hill-dev/wsrelay-server) repository for an implementation of a WebSocket Relay Server that implements the protocol on the server side.

## Quick Start

1. Start up an WebSocket Relay server or use an existing one.
1. Build this library via TypeScript: `tsc -b` which produces a `bin/wsRelayClient.js` file.
1. Run the demo `demo/index.html` to see how it works.

## Features

- Dramatically simplifies implementation of custom communication mechanisms involving a WebSocket Relay server.
- Users grouped together into seperate realms allowing a single WebSocket Relay server to be used for multiple purposes simultaneously.
- Be notified when users connect (join) and disconnect from (leave) a realm.
- No need to have thorough knowledge of the WebSocket Relay protocol.
- Tree-based realm structure permitting the creation or joining of a realm which is a child realm of some parent realm.
- Can send messages across realms.
- Can save and load community data on a realm-by-realm basis, useful in scenarios where for example you want to associate state with a realm.
- Realm community data can automatically be deleted.
- Can log incoming and outgoing packets to simplify diagnosis of any issue.
- IntelliSense support for major interfaces and classes.
- Support for secure websockets (`wss://`).

## Channel Handler

Implement the `WSRelayClient.IChannelHandler` interface to define how you want to handle commincation from a WebSocket Relay server. Use the `client` parameter in each of the methods where necessary to communicate back to the WebSocket Relay server:

```typescript
class MyCustomChannelHandler implements WSRelayClient.IChannelHandler {
    
    public channelStatus(client: IWebSocketRelayClient, status: ChannelStatus): void {
        console.log(`Channel status is ${status}`);
    }
    
    public assignUserNumber(client: IWebSocketRelayClient, userNumber: number): void {
        console.log(`You have been assigned user number ${userNumber}`);
    }
    
    public assignRealmNumber(client: IWebSocketRelayClient, realmNumber: number): void {
        console.log(`You have been assigned realm number ${realmNumber}`);
    }
    
    public usersJoined(client: IWebSocketRelayClient, userNumbers: number[], joinedBeforeYou: boolean): void {
        for (let userNumber of userNumbers) {
            console.log(`User joined: ${userNumber}`);
        }
    }
    
    public userLeft(client: IWebSocketRelayClient, userNumber: number): void {
        console.log(`User left: ${userNumber}`);
    }
    
    public childRealmCreated(client: IWebSocketRelayClient, realmNumber: number): void {
        console.log(`Child realm created: ${realmNumber}`);
    }
    
    public childRealmDestroyed(client: IWebSocketRelayClient, realmNumber: number): void {
        console.log(`Child realm destroyed: ${realmNumber}`);
    }
    
    public handleMessage(client: IWebSocketRelayClient, senderUserNumber: number, target: MessageTarget, message: string): void {
        console.log(`Message received: [${senderUserNumber}:${target}] ${message}`);
    }
    
    public handleData(client: IWebSocketRelayClient, realmNumber: number, name: string, data: string): void {
        console.log(`Data received: [${realmNumber}:${name}] ${data}`);
    }

}
```

## Connecting to a Server

Use an instance of `IWebSocketRelayClient` (such as `WebSocketRelayClient`) to connect to a WebSocket Relay server:

```typescript
let address = document.getElementById('addressTextBox').value;
let protocol = document.getElementById('protocolTextBox').value;
let handler = new MyCustomChannelHandler();
let client = new WSRelayClient.WebSocketRelayClient(address, protocol, demoHandler);
```

## Joining Realms

Users are grouped together into realms. Typically only users in the same realm can communicate with each other.

For simple scenarios, a good place to join a realm is when you are told what your user number is:

```typescript
public assignUserNumber(client: IWebSocketRelayClient, userNumber: number): void {
    client.joinRealm(9999); // When we are told our user number, join realm #9999
    
    // TODO: Implement `assignRealmNumber` to be advised when this is complete.
}
```

You can also create a realm and join it:

```typescript
client.createRealm(RealmType.realm); // If realm type is `RealmType.childRealm`, a child realm of the current realm is created instead.
```

## Sending Messages to Other Users

It is possible to broadcast messages to everyone in a realm, or specific people within a realm:

```typescript
client.sendToAll(message); // Send a message to everyone in the realm
client.sendToAllExceptMe(message); // Send a message to everyone in the realm (except me)
client.sendToUser(userNumber, message); // Send a message to one user
client.sendToRealm(realmNumber, message); // Send a message to everyone in some other realm
```

## Shared Data Management

You can save data to a realm:

```typescript
client.saveData('my_data', 'one two three');
```

And you can load data from a realm:

```typescript
client.loadData('my_data'); // Implement `IChannelHandler.handleData` to handle the response.
```

## Alternative Channel Handlers

If you want some middleware to treat data as parameterised commands then implement `CommandChannelHandler`. You can then encode and decode string arrays as single strings, simplifying a common scenario where you want to handle more complex data packets.

If you want support for automated realm host management and peer to peer connections consider the experimental `PeerChannelHandler` class.

## License

The WebSocket Relay client was written by Nick Hill and is released under the MIT license. See LICENSE for more information.