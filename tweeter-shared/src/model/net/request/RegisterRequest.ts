// AI-assisted: see AI-ATTRIBUTION.md
import { TweeterRequest } from "./TweeterRequest";

export class RegisterRequest extends TweeterRequest {
  public constructor(
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly alias: string,
    public readonly password: string,
    public readonly imageStringBase64: string,
    public readonly imageFileExtension: string
  ) {
    super();
  }
}
