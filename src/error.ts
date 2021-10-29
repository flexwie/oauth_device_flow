import { AxiosResponse } from "axios";

export class ResponseError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public response: AxiosResponse
  ) {
    super(message);
  }

  toString() {
    return `${this.name}: ${this.statusCode} - ${this.message}\n${this.stack}`;
  }
}
