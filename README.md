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
```
