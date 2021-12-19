import axios, { AxiosResponse } from "axios";
import { ResponseError } from "./error";
import { URLSearchParams } from 'url'
import {
  CacheEntry,
  ClientCache,
  ClientOptions,
  DeviceCodeResponse,
  DeviceFlowDetails,
  TokenResponseError,
  TokenResponseSuccess,
} from "./types";

export class DeviceFlowClient {
  private internalCache: ClientCache = {};

  constructor(
    public connection: DeviceFlowDetails,
    public options?: ClientOptions
  ) { }

  private log(str: string) {
    if (this.options?.output) {
      this.options.output(str);
    } else {
      console.log(str);
    }
  }

  public get cache(): CacheEntry {
    if (this.options?.cache?.beforeCacheAccess) {
      this.internalCache = this.options?.cache?.beforeCacheAccess();
    }

    return this.internalCache[this.connection.client_id];
  }

  public set cache(v: CacheEntry) {
    this.internalCache[this.connection.client_id] = v;

    if (this.options?.cache?.afterCacheAccess) {
      this.options.cache.afterCacheAccess(this.internalCache);
    }
  }

  /**
   * Initiates the procedure
   * @returns The device and user codes, also the polling interval
   */
  private async getDeviceCode(): Promise<DeviceCodeResponse> {
    try {
      const scopes = this.options?.refreshToken
        ? [...this.connection.scopes, "offline_access"]
        : this.connection.scopes;

      let response

      if (this.options?.useParams) {
        const params = new URLSearchParams()
        params.append('client_id', this.connection.client_id)
        params.append('audience', this.connection.audience)
        params.append('scope', scopes.join(" "))

        response = await axios.post<DeviceCodeResponse>(this.connection.code_url, params, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          }
        })
      } else {
        // get device and user code from remote
        response = await axios.post<DeviceCodeResponse>(
          this.connection.code_url,
          {
            client_id: this.connection.client_id,
            scope: scopes.join(" "),
            audience: this.connection.audience,
          }
        );

      }

      return response.data;
    } catch (error: any) {
      throw new ResponseError(
        error.response.data.error,
        error.response.code,
        error.response
      );
    }
  }

  /**
   * Polls the provider and tries to acquire a access token
   * @param device_code The device code from the auth provider
   * @returns Access and refresh tokens
   */
  private async pollForToken(
    device_code: string
  ): Promise<TokenResponseSuccess | null> {
    try {
      let response: AxiosResponse

      // request the access token
      if (this.options?.useParams) {
        const params = new URLSearchParams()
        params.append('client_id', this.connection.client_id)
        params.append('device_code', device_code)
        params.append('grant_type', "urn:ietf:params:oauth:grant-type:device_code")

        response = await axios.post<
          Partial<TokenResponseError & TokenResponseSuccess>
        >(this.connection.token_url, params, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          }
        });

      } else {
        response = await axios.post<
          Partial<TokenResponseError & TokenResponseSuccess>
        >(this.connection.token_url, {
          client_id: this.connection.client_id,
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code,
        });
      }

      // return tokens if successfull
      if (response.data.access_token) {
        return response.data as TokenResponseSuccess;
      }

      // else return null indicating that user has not finished flow
      return null;
    } catch (errorV: any) {
      const {
        response: {
          status,
          data: { error, error_description },
        },
      } = errorV;

      // only throw error if there is something actually going wrong
      if (!(error == "authorization_pending")) {
        throw new ResponseError(error_description, status, error);
      }

      // else return null indicating that user has not finished flow
      return null;
    }
  }

  /**
   * Get an access token interactively
   * @returns the access token
   */
  async acquireToken() {
    // indicate if the operation was already a sucess
    // and trash pending promise rejections
    let success = false;
    let codeResponse: DeviceCodeResponse;
    let that = this;

    // get a device code
    try {
      codeResponse = await this.getDeviceCode();

      // prompt user
      this.log(
        codeResponse.verification_uri_complete
          ? `Please visit ${codeResponse.verification_uri_complete} and confirm the request.`
          : `Please visit ${codeResponse.verification_uri} and enter the code ${codeResponse.user_code}`
      );
    } catch (error) {
      throw new Error("Could not get code response");
    }

    return new Promise<string>((resolve, reject) => {
      // initiate timer
      let timer = setInterval(async function () {
        try {
          // try to get token
          const result = await that.pollForToken(codeResponse.device_code);
          if (result != null) {
            success = true;

            // handle token cache
            that.cache = {
              ...result,
              expiration: Date.now() + result.expires_in * 1000,
            };

            // provide user with accesstoken
            resolve(result.access_token);

            // remove the timer
            clearInterval(timer);
          }
        } catch (error) {
          // just exit if operation was already a success
          if (success) return;
          reject(error);
        }
      }, codeResponse.interval * 1000);
    });
  }

  /**
   * Tries to acquire a token in the background
   * Will prompt for user action when access and refresh tokens are expired
   */
  public async acquireTokenSilently(): Promise<string> {
    if (this.cache.expiration >= Date.now() + this.cache.expires_in * 1000) {
      try {
        // try refresh token
        const result = await axios.post<TokenResponseSuccess>(
          this.connection.token_url,
          {
            grant_type: "refresh_token",
            client_id: this.connection.client_id,
            refresh_token: this.cache.refresh_token,
          }
        );

        return result.data.access_token;
      } catch (error) {
        // prompt for new token
        return await this.acquireToken();
      }
    } else {
      //return token from cache
      return this.cache.access_token;
    }
  }
}
