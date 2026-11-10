// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, PagedStatusItemRequest, PagedStatusItemResponse, PostSegment, Status, Type, User } from "tweeter-shared";
import { StatusService } from "../../src/model.service/StatusService";
import { ClientCommunicator } from "../../src/net/ClientCommunicator";
import { ServerFacade } from "../../src/net/ServerFacade";

const request = new PagedStatusItemRequest("dummy-token", "@allen", 10, null);
const dto = { post: "Hello @amy https://byu.edu", timestamp: 0, user: { firstName: "Allen", lastName: "Anderson", alias: "@allen", imageUrl: "image.png" } };

describe.each([
  { feature: "story", facadeMethod: "getMoreStory" as const, serviceMethod: "loadMoreStoryItems" as const },
  { feature: "feed", facadeMethod: "getMoreFeed" as const, serviceMethod: "loadMoreFeedItems" as const },
])("$feature client networking", ({ feature, facadeMethod, serviceMethod }) => {
  afterEach(() => jest.restoreAllMocks());

  it("reconstructs nested domain objects and regenerates clickable segments", async () => {
    const operation = jest.spyOn(ClientCommunicator.prototype, "doPost")
      .mockResolvedValue(new PagedStatusItemResponse(true, null, [dto], true));

    const [items, hasMore] = await new ServerFacade()[facadeMethod](request);

    expect(operation).toHaveBeenCalledWith(request, `/${feature}/list`);
    expect(hasMore).toBe(true);
    expect(items[0]).toBeInstanceOf(Status);
    expect(items[0].user).toBeInstanceOf(User);
    expect(items[0].dto).toEqual(dto);
    expect(items[0].equals(Status.fromDto(dto))).toBe(true);
    expect(items[0].segments.every((segment) => segment instanceof PostSegment)).toBe(true);
    expect(items[0].segments.some((segment) => segment.type === Type.alias && segment.text === "@amy")).toBe(true);
    expect(items[0].segments.some((segment) => segment.type === Type.url && segment.text === "https://byu.edu")).toBe(true);
    expect(Status.fromJson(items[0].toJson())!.equals(items[0])).toBe(true);
  });

  it("preserves an empty final page", async () => {
    jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(new PagedStatusItemResponse(true, null, [], false));

    await expect(new ServerFacade()[facadeMethod](request)).resolves.toEqual([[], false]);
  });

  it.each([
    { items: undefined, hasMore: true }, { items: [null], hasMore: true },
    { items: [{ ...dto, user: {} }], hasMore: true }, { items: [{ ...dto, timestamp: "0" }], hasMore: true },
    { items: [{ ...dto, timestamp: NaN }], hasMore: true }, { items: [{ ...dto, timestamp: -1 }], hasMore: true },
    { items: [{ ...dto, post: null }], hasMore: true }, { items: [dto], hasMore: "false" },
    { items: [dto], hasMore: undefined },
  ])("rejects malformed page data %p", async (page) => {
    const response = { success: true, message: null, ...page };
    jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(response);

    await expect(new ServerFacade()[facadeMethod](request)).rejects.toThrow(`Invalid ${feature} response.`);
  });

  it.each([["Page unavailable", "Page unavailable"], [null, `Failed to load ${feature}.`]] as const)(
    "propagates an unsuccessful operation with message %p", async (message, expected) => {
      jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(new PagedStatusItemResponse(false, message, [], false));

      await expect(new ServerFacade()[facadeMethod](request)).rejects.toThrow(expected);
    }
  );

  it("passes null and DTO cursors through the client service while preserving domain results", async () => {
    const facade = new ServerFacade();
    const cursor = Status.fromDto(dto);
    const result: [Status[], boolean] = [[cursor], true];
    const operation = jest.spyOn(facade, facadeMethod).mockResolvedValue(result);
    const service = new StatusService(facade);
    const token = new AuthToken(request.token, Date.now());

    await expect(service[serviceMethod](token, request.userAlias, 10, null)).resolves.toBe(result);
    expect(operation).toHaveBeenLastCalledWith(request);
    await expect(service[serviceMethod](token, request.userAlias, 10, cursor)).resolves.toBe(result);
    expect(operation).toHaveBeenLastCalledWith(new PagedStatusItemRequest(request.token, request.userAlias, 10, dto));
  });

  it("propagates transport failures through the facade and service", async () => {
    jest.spyOn(ClientCommunicator.prototype, "doPost").mockRejectedValue(new Error("HTTP failure"));

    await expect(new StatusService()[serviceMethod](new AuthToken(request.token, 0), "@allen", 10, null))
      .rejects.toThrow("HTTP failure");
  });
});
