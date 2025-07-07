# ip-leak

Reveals the IP address of a user using WebRTC, even behind some proxies or VPNs.

This module can be used as a defensive security tool as it helps users understand what their real IP exposure is, which is important for privacy and security awareness.

## Installation

```sh
npm install ip-leak
```

## Usage

```ts
import getIp from "ip-leak";

await getIp();
// => 17.5.7.3

// Set a custom timeout (in milliseconds)
await getIp({ timeout: 10000 }); // 10 seconds

// Use your own STUN servers
await getIp({
  iceServers: ["stun:custom-server.com:3478", "stun:backup-server.com:3478"],
});

// Custom servers and timeout
await getIp({
  iceServers: ["stun:corporate-server.internal:3478"],
  timeout: 3000,
});
```
