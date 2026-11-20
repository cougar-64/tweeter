// AI-assisted: see AI-ATTRIBUTION.md
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { UploadedImage } from "../DAOModels";
import type { ImageDAO } from "../ImageDAO";

export class S3ImageDAO implements ImageDAO {
  public constructor(
    private readonly client: S3Client,
    private readonly bucketName: string,
    private readonly region: string
  ) {
    if (bucketName.trim().length === 0 || region.trim().length === 0) {
      throw new Error("An image bucket name and AWS region are required.");
    }
  }

  public async putImage(imageId: string, bytes: Uint8Array, contentType: string): Promise<UploadedImage> {
    const key = this.imageKey(imageId);
    if (bytes.byteLength === 0 || !/^image\/[a-zA-Z0-9.+-]+$/.test(contentType)) {
      throw new Error("Image bytes and an image content type are required.");
    }
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: bytes,
      ContentType: contentType,
      // Registration supplies a unique ID. Never overwrite an earlier upload.
      IfNoneMatch: "*",
      // BucketOwnerEnforced disables ACLs; the bucket policy grants public reads.
    }));

    return {
      imageId,
      url: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/image/${encodeURIComponent(imageId)}`,
    };
  }

  public async deleteImage(imageId: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: this.imageKey(imageId),
    }));
  }

  private imageKey(imageId: string): string {
    // IDs are a single path segment shared by upload, public URL, and cleanup.
    if (imageId.trim().length === 0 || imageId === "." || imageId === ".." || /[/\\\x00-\x1f\x7f]/.test(imageId)) {
      throw new Error("A valid image ID is required.");
    }
    return `image/${imageId}`;
  }
}
