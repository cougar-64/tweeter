// AI-assisted: see AI-ATTRIBUTION.md
export class TweeterResponse {
  public constructor(
    public readonly success: boolean,
    public readonly message: string | null = null
  ) {}
}
