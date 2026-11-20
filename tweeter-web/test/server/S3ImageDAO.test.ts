/** @jest-environment node */
// AI-assisted: see AI-ATTRIBUTION.md
import { DeleteObjectCommand, PutObjectCommand, S3Client, S3ServiceException } from "@aws-sdk/client-s3";
import { S3ImageDAO } from "../../../tweeter-server/src/model/dao/s3/S3ImageDAO";

const imageId = "unique-profile.png";
const bytes = new Uint8Array([137, 80, 78, 71]);

describe("S3ImageDAO", () => {
  const client = new S3Client({ region: "us-east-1" });
  const dao = new S3ImageDAO(client, "test-profile-images", "us-east-1");

  afterEach(() => jest.restoreAllMocks());
  afterAll(() => client.destroy());

  it("uploads raw bytes with the supplied content type and returns the image handle and URL", async () => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    await expect(dao.putImage(imageId, bytes, "image/png")).resolves.toEqual({
      imageId, url: "https://test-profile-images.s3.us-east-1.amazonaws.com/image/unique-profile.png",
    });
    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0] as PutObjectCommand;
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toEqual({
      Bucket: "test-profile-images", Key: `image/${imageId}`,
      Body: bytes, ContentType: "image/png", IfNoneMatch: "*",
    });
    expect(command.input.Body).toBe(bytes);
    expect(command.input).not.toHaveProperty("ACL");
  });

  it("encodes the public URL while keeping the original object key for deletion", async () => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    const id = "profile photo+#?.jpeg";
    const result = await dao.putImage(id, bytes, "image/jpeg");
    expect(result).toEqual({
      imageId: id,
      url: "https://test-profile-images.s3.us-east-1.amazonaws.com/image/profile%20photo%2B%23%3F.jpeg",
    });
    expect((send.mock.calls[0][0] as PutObjectCommand).input.Key).toBe(`image/${id}`);
    await dao.deleteImage(result.imageId);
    expect((send.mock.calls[1][0] as DeleteObjectCommand).input.Key).toBe(`image/${id}`);
  });

  it("uses the configured region and bucket in the returned URL", async () => {
    jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    const regionalDAO = new S3ImageDAO(client, "another-image-bucket", "us-west-2");
    await expect(regionalDAO.putImage(imageId, bytes, "image/webp")).resolves.toEqual({
      imageId, url: "https://another-image-bucket.s3.us-west-2.amazonaws.com/image/unique-profile.png",
    });
  });

  it("propagates an existing-key failure without attempting an overwrite or cleanup", async () => {
    const error = new S3ServiceException({ name: "PreconditionFailed", message: "Already exists", $metadata: { httpStatusCode: 412 }, $fault: "client" });
    const send = jest.spyOn(client, "send").mockImplementation(async () => { throw error; });
    await expect(dao.putImage(imageId, bytes, "image/png")).rejects.toBe(error);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("deletes the image under the same prefix and permits repeated cleanup", async () => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    await dao.deleteImage(imageId);
    await dao.deleteImage(imageId);
    expect(send).toHaveBeenCalledTimes(2);
    for (const [command] of send.mock.calls) {
      expect(command).toBeInstanceOf(DeleteObjectCommand);
      expect((command as DeleteObjectCommand).input).toEqual({
        Bucket: "test-profile-images", Key: `image/${imageId}`,
      });
    }
  });

  it.each(["put", "delete"])("propagates AWS failures during %s", async (operation) => {
    const error = new Error("S3 unavailable");
    jest.spyOn(client, "send").mockImplementation(async () => { throw error; });
    await expect(operation === "put" ? dao.putImage(imageId, bytes, "image/png") : dao.deleteImage(imageId))
      .rejects.toBe(error);
  });

  it.each(["", " ", ".", "..", "../other.png", "folder/image.png", "folder\\image.png", "bad\nimage.png"])(
    "rejects invalid image ID %j for uploads and deletes before contacting AWS", async (id) => {
      const send = jest.spyOn(client, "send");
      await expect(dao.putImage(id, bytes, "image/png")).rejects.toThrow("A valid image ID is required.");
      await expect(dao.deleteImage(id)).rejects.toThrow("A valid image ID is required.");
      expect(send).not.toHaveBeenCalled();
    }
  );

  it.each(["", "text/html", "application/octet-stream", "image/png\r\nx-other: value"])(
    "rejects an invalid image content type %j before upload", async (contentType) => {
      const send = jest.spyOn(client, "send");
      await expect(dao.putImage(imageId, bytes, contentType)).rejects.toThrow("Image bytes and an image content type are required.");
      expect(send).not.toHaveBeenCalled();
    }
  );

  it("rejects empty image bytes before upload", async () => {
    const send = jest.spyOn(client, "send");
    await expect(dao.putImage(imageId, new Uint8Array(), "image/png")).rejects.toThrow("Image bytes and an image content type are required.");
    expect(send).not.toHaveBeenCalled();
  });

  it.each([["", "us-east-1"], ["test-profile-images", " "]])("rejects missing bucket/region configuration", (bucket, region) => {
    expect(() => new S3ImageDAO(client, bucket, region)).toThrow("An image bucket name and AWS region are required.");
  });
});
