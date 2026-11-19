// AI-assisted: see AI-ATTRIBUTION.md
import type { UploadedImage } from "./DAOModels";

export interface ImageDAO {
  /** Use a unique image ID for each upload so duplicate registrations cannot overwrite it. */
  putImage(imageId: string, bytes: Uint8Array, contentType: string): Promise<UploadedImage>;
  deleteImage(imageId: string): Promise<void>;
}
