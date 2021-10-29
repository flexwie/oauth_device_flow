## OAuth2 Device Flow Client

This is a client for using OAuth2 Device Flows in applications with limited interation possibilities.

```typescript
import { DeviceFlowClient } from "index";

const app = new DeviceFlowClient({
  audience: "AUDIENCE",
  client_id: "CLIENT_ID",
  scopes: ["openid", "offline_access"],
  code_url: "DEVICE_CODE_URL",
  token_url: "TOKEN_URL",
}, {
  output: (str) => console.info(str)
});

// get token interactively
app
  .acquireToken()
  .then((token) => /* ...do stuff */);

// get token silently
app
  .acquireTokenSilently()
  .then((token) => /* ...do stuff */);

```

### Configuration

The client requires the following parameter:

```typescript
/**
 * Endpoint used to fetch tokens
 * @example https://tenant.eu.auth0.com/oauth/token
 */
token_url: string;
/**
 * Endpoint used to fetch the device and user code
 * @example https://tenant.eu.auth0.com/oauth/device/code
 */
code_url: string;
/**
 * The client ID
 * You get this from your OAuth provider
 */
client_id: string;
/**
 * The requested scopes
 * Will automatically include "offline_access" if you set the "refreshToken" option
 */
scopes: string[];
/**
 * The audience for your request
 */
audience: string;
```

Additionally you can provide a few other options to customize your experience and implement a cache:

```typescript
/**
 * Provide a cache for the token and metadata
 */
cache?: {
  /**
   * Deerialize the cache
   */
  beforeCacheAccess: () => ClientCache;
  /**
   * Serialize the cache
   */
  afterCacheAccess: (cache: ClientCache) => void;
};
/**
 * Customize the console output
 */
output?: (str: string) => void;
/**
 * Request a refresh token?
 */
refreshToken?: boolean;
```
