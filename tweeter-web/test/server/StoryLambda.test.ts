// AI-assisted: see AI-ATTRIBUTION.md
import { FakeData, Status, User } from "tweeter-shared";
import { handler as storyHandler } from "../../../tweeter-server/src/lambda/status/GetStoryLambda";
import { handler as feedHandler } from "../../../tweeter-server/src/lambda/status/GetFeedLambda";
import { StatusService } from "../../../tweeter-server/src/model/service/StatusService";

const request = { token: "dummy-token", userAlias: "@allen", pageSize: 10, lastItem: null };

describe.each([
  { feature: "Story", handler: storyHandler, method: "loadMoreStoryItems" as const, otherMethod: "loadMoreFeedItems" as const },
  { feature: "Feed", handler: feedHandler, method: "loadMoreFeedItems" as const, otherMethod: "loadMoreStoryItems" as const },
])("$feature Lambda", ({ handler, method, otherMethod }) => {
  afterEach(() => jest.restoreAllMocks());

  it("reconstructs the cursor, forwards inputs, and returns status DTOs", async () => {
    const cursor = new Status("Hello @amy", new User("Allen", "Anderson", "@allen", "image.png"), 0);
    const next = new Status("Another post", cursor.user, 123);
    const operation = jest.spyOn(StatusService.prototype, method).mockResolvedValue([[next], false]);
    const otherOperation = jest.spyOn(StatusService.prototype, otherMethod);

    await expect(handler({ ...request, lastItem: cursor.dto }))
      .resolves.toEqual({ success: true, message: null, items: [next.dto], hasMore: false });
    expect(operation).toHaveBeenCalledWith(request.token, request.userAlias, 10, expect.any(Status));
    const receivedCursor = operation.mock.calls[0][3]!;
    expect(receivedCursor.user).toBeInstanceOf(User);
    expect(receivedCursor.equals(cursor)).toBe(true);
    expect(otherOperation).not.toHaveBeenCalled();
  });

  it("returns the expected first page of dummy statuses", async () => {
    const response = await handler(request);

    expect(response.items).toEqual(FakeData.instance.fakeStatuses.slice(0, 10).map((status) => status.dto));
    expect(response.hasMore).toBe(true);
  });

  it("uses a JSON cursor to advance to the next page", async () => {
    const first = await handler(request);
    const second = await handler({ ...request, lastItem: JSON.parse(JSON.stringify(first.items[9])) });

    expect(second.items).toEqual(FakeData.instance.fakeStatuses.slice(10, 20).map((status) => status.dto));
    expect(second.hasMore).toBe(true);
  });

  it("returns an empty final page after the last status", async () => {
    const statuses = FakeData.instance.fakeStatuses;
    const response = await handler({ ...request, lastItem: statuses[statuses.length - 1].dto });

    expect(response.items).toEqual([]);
    expect(response.hasMore).toBe(false);
  });

  it("propagates service failures", async () => {
    jest.spyOn(StatusService.prototype, method).mockRejectedValue(new Error("Page failed"));

    await expect(handler(request)).rejects.toThrow("Page failed");
  });

  const validCursor = { post: "Hello", timestamp: 0, user: { firstName: "Allen", lastName: "Anderson", alias: "@allen", imageUrl: "image.png" } };
  it.each<[string, unknown]>([
    ["missing request", undefined], ["null request", null], ["array request", []],
    ["blank token", { ...request, token: " " }], ["blank alias", { ...request, userAlias: " " }],
    ["zero page size", { ...request, pageSize: 0 }], ["fractional page size", { ...request, pageSize: 1.5 }],
    ["missing cursor", { token: request.token, userAlias: request.userAlias, pageSize: 10 }],
    ["empty cursor", { ...request, lastItem: {} }],
    ["non-string post", { ...request, lastItem: { ...validCursor, post: 123 } }],
    ["negative timestamp", { ...request, lastItem: { ...validCursor, timestamp: -1 } }],
    ["nonfinite timestamp", { ...request, lastItem: { ...validCursor, timestamp: Infinity } }],
    ["missing author", { ...request, lastItem: { ...validCursor, user: null } }],
    ["blank author alias", { ...request, lastItem: { ...validCursor, user: { ...validCursor.user, alias: " " } } }],
  ])("rejects %s before calling the service", async (_description, invalidRequest) => {
    const operation = jest.spyOn(StatusService.prototype, method);

    await expect(handler(invalidRequest)).rejects.toThrow("[Bad Request]");
    expect(operation).not.toHaveBeenCalled();
  });
});
