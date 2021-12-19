/**
 * Provide details for your client and the connection to your OAuth Provider
 */
export type DeviceFlowDetails = {
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
};

/**
 * Customize the behaviour of the client
 */
export type ClientOptions = {
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
  /**
   * Weather too send data as params in requests
   */
  useParams?: boolean
};

export type CacheEntry = TokenResponseSuccess & {
  expiration: number;
};

export type ClientCache = Record<string, CacheEntry>;

export type DeviceCodeResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval: number;
};

export type TokenResponseError = {
  error:
  | "authorization_pending"
  | "slow_down"
  | "expired_token"
  | "access_denied";
  error_description: string;
};

export type TokenResponseSuccess = {
  access_token: string;
  refresh_token?: string;
  id_token: string;
  token_type: string;
  expires_in: number;
};
