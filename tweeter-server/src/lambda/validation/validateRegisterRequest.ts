// AI-assisted: see AI-ATTRIBUTION.md
import type { RegisterRequest } from "tweeter-shared";
import { validateLoginRequest } from "./validateLoginRequest";

export function validateRegisterRequest(request: unknown): asserts request is RegisterRequest {
  // Registration also supplies login credentials, so reuse their validation.
  validateLoginRequest(request);
  const fields = request as Partial<RegisterRequest>;
  for (const [field, label] of [
    ["firstName", "A first name"],
    ["lastName", "A last name"],
    ["imageStringBase64", "A Base64 image"],
    ["imageFileExtension", "An image file extension"],
  ] as const) {
    const value = fields[field];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`[Bad Request] ${label} is required.`);
    }
  }
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(fields.imageStringBase64!)) {
    throw new Error("[Bad Request] The image must be valid Base64.");
  }
}
