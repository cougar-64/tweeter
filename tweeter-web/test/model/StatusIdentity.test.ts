// AI-assisted: see AI-ATTRIBUTION.md
import { isPersistedStatusDto, isStatusDto, isStatusId, PostSegment, Status, Type, User } from "tweeter-shared";

const user = new User("Amy", "Ames", "@amy", "https://example.com/amy.png");
const legacy = { post: "Hello @bob https://example.com", timestamp: 1000, user: user.dto };

describe("Status identity", () => {
  it("preserves an assigned ID through DTO and JSON round-trips without losing domain behavior", () => {
    const dto = { ...legacy, statusId: "post-a" };
    const status = Status.fromDto(JSON.parse(JSON.stringify(dto)));
    expect(status.statusId).toBe("post-a");
    expect(status.dto).toEqual(dto);
    expect(Status.fromJson(status.toJson())!.dto).toEqual(dto);
    expect(status.user).toBeInstanceOf(User);
    expect(status.segments.every((segment) => segment instanceof PostSegment)).toBe(true);
    expect(status.segments.some((segment) => segment.type === Type.alias && segment.text === "@bob")).toBe(true);
  });

  it("keeps new and legacy statuses ID-free instead of generating IDs during conversion", () => {
    const fresh = new Status(legacy.post, user, legacy.timestamp);
    const converted = Status.fromDto(legacy);
    expect(fresh.statusId).toBeUndefined();
    expect(converted.statusId).toBeUndefined();
    expect(converted.dto).toEqual(legacy);
    expect(converted.dto).not.toHaveProperty("statusId");
    expect(Status.fromJson(converted.toJson())!.dto).toEqual(legacy);
  });

  it("uses distinct IDs to distinguish otherwise identical posts", () => {
    const first = new Status(legacy.post, user, 1000, "post-a");
    const second = new Status(legacy.post, user, 1000, "post-b");
    expect(first.equals(second)).toBe(false);
    expect(first.equals(Status.fromDto(first.dto))).toBe(true);
  });

  it("treats a matching globally unique ID as identity even if a snapshot differs", () => {
    expect(new Status("original", user, 1000, "post-a").equals(new Status("snapshot", user, 1000, "post-a"))).toBe(true);
  });

  it("does not equate an identified post with legacy data based only on content", () => {
    const identified = new Status(legacy.post, user, 1000, "post-a");
    const old = Status.fromDto(legacy);
    expect(identified.equals(old)).toBe(false);
    expect(old.equals(identified)).toBe(false);
  });

  it("retains payload equality for legacy data", () => {
    const old = Status.fromDto(legacy);
    expect(old.equals(Status.fromDto(legacy))).toBe(true);
    expect(old.equals(new Status("different", user, 1000))).toBe(false);
    expect(old.equals(new Status(legacy.post, user, 1001))).toBe(false);
  });

  it("distinguishes valid legacy/unsaved DTOs from persisted DTOs", () => {
    expect(isStatusDto(legacy)).toBe(true);
    expect(isPersistedStatusDto(legacy)).toBe(false);
    expect(isPersistedStatusDto({ ...legacy, statusId: "post-a" })).toBe(true);
    expect(isStatusId("01234567-89ab-cdef-0123-456789abcdef")).toBe(true);
    expect(isStatusId("a".repeat(128))).toBe(true);
  });

  it.each(["", " ", "bad#id", "bad/id", "a".repeat(129)])("rejects malformed ID %j in constructors and DTO guards", (id) => {
    expect(() => new Status(legacy.post, user, 1000, id)).toThrow("Invalid status ID.");
    expect(isStatusDto({ ...legacy, statusId: id })).toBe(false);
    expect(isPersistedStatusDto({ ...legacy, statusId: id })).toBe(false);
  });

  it.each([null, 123, {}, []])("rejects a non-string ID %j", (id) => {
    expect(isStatusId(id)).toBe(false);
    expect(isStatusDto({ ...legacy, statusId: id })).toBe(false);
  });

  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("rejects invalid millisecond timestamp %s", (timestamp) => {
    expect(isStatusDto({ ...legacy, timestamp })).toBe(false);
  });
});
