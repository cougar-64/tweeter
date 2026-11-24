// AI-assisted: see AI-ATTRIBUTION.md
import { randomUUID } from "node:crypto";
import { AuthToken, PagedStatusItemRequest, PagedUserItemRequest, PostStatusRequest, Status, User, UserAliasRequest } from "tweeter-shared";
import { StatusService } from "../../src/model.service/StatusService";
import { expectLiveError, expectLivePreflight, loadLiveTestContext, registerLiveUser, waitForLive, type LiveTestContext } from "./support/liveTestContext";

describe("Persisted posting and feed delivery integration", () => {
  let context: LiveTestContext;
  let author: User;
  let reader: User;
  let authorToken: AuthToken;
  let readerToken: AuthToken;
  const followerRequest = () => new PagedUserItemRequest(authorToken.token, author.alias, 10, null);
  const storyRequest = () => new PagedStatusItemRequest(authorToken.token, author.alias, 10, null);
  const feedRequest = () => new PagedStatusItemRequest(readerToken.token, reader.alias, 10, null);
  beforeAll(async () => {
    context = await loadLiveTestContext();
    [author, authorToken] = await registerLiveUser(context, "PostingAuthor");
    [reader, readerToken] = await registerLiveUser(context, "FeedReader");
  });
  afterAll(async () => {
    try { if (readerToken && author) await context.facade.unfollow(new UserAliasRequest(readerToken.token, author.alias)); }
    finally { await context?.cleanup(); }
  });

  it.each(["facade", "service"] as const)("persists authoritative posts through the %s, delivers while following, and stops future delivery after unfollow", async (client) => {
    await context.facade.follow(new UserAliasRequest(readerToken.token, author.alias));
    await waitForLive(() => context.facade.getMoreFollowers(followerRequest()), ([users]) => users.length === 1 && users[0].alias === reader.alias);
    const text = `Live post ${randomUUID()} @reader https://example.com`;
    // A valid but forged identity/time/ID must not be persisted as authoritative.
    const submitted = new Status(text, User.fromDto(context.fixtures.users.authorA), 0, "client-claimed-id");
    if (client === "facade") await context.facade.postStatus(new PostStatusRequest(authorToken.token, submitted.dto));
    else await new StatusService(context.facade).postStatus(authorToken, submitted);
    const [story] = await context.facade.getMoreStory(storyRequest());
    const posted = story.filter((item) => item.post === text);
    expect(posted).toHaveLength(1);
    expect(posted[0].user.dto).toEqual(author.dto);
    expect(posted[0].timestamp).toBeGreaterThan(0);
    expect(posted[0].statusId).toMatch(/^[a-f0-9-]{36}$/);
    expect(posted[0].statusId).not.toBe(submitted.statusId);
    // Success promises synchronous feed delivery; do not poll away a missing copy.
    const [delivered] = await context.facade.getMoreFeed(feedRequest());
    expect(delivered.filter((item) => item.statusId === posted[0].statusId).map((item) => item.dto)).toEqual([posted[0].dto]);
    await expect(context.facade.getMoreStory(new PagedStatusItemRequest(readerToken.token, reader.alias, 10, null))).resolves.toEqual([[], false]);

    await context.facade.unfollow(new UserAliasRequest(readerToken.token, author.alias));
    await waitForLive(() => context.facade.getMoreFollowers(followerRequest()), ([users]) => users.length === 0);
    const afterUnfollow = new Status(`After unfollow ${randomUUID()}`, author, 0);
    await context.facade.postStatus(new PostStatusRequest(authorToken.token, afterUnfollow.dto));
    const [updatedStory] = await context.facade.getMoreStory(storyRequest());
    const newer = updatedStory.find((item) => item.post === afterUnfollow.post);
    expect(newer).toBeDefined();
    const [retained] = await context.facade.getMoreFeed(feedRequest());
    expect(retained.some((item) => item.statusId === newer!.statusId)).toBe(false);
    expect(retained.some((item) => item.statusId === posted[0].statusId)).toBe(true);
  });

  it.each(["token", "post", "status"] as const)("returns 400 with CORS for invalid %s", async (field) => {
    const status = new Status("Validation only", author, 0).dto;
    await expectLiveError(context, "/status/post", { token: field === "token" ? "" : authorToken.token,
      status: field === "post" ? { ...status, post: " \n " } : field === "status" ? { ...status, user: {} } : status }, 400,
    field === "token" ? "[Bad Request] A token is required." : field === "post" ? "[Bad Request] A nonempty post is required." : "[Bad Request] A valid status DTO is required.");
  });
  it("returns 401 with CORS and writes nothing for an invalid session", async () => {
    const text = `Unauthorized ${randomUUID()}`;
    await expectLiveError(context, "/status/post", new PostStatusRequest("invalid-token", new Status(text, author, 0).dto),
      401, "[Unauthorized] Invalid or expired authentication token.");
    const [story] = await context.facade.getMoreStory(storyRequest());
    expect(story.some((item) => item.post === text)).toBe(false);
  });
  it("allows browser preflight", async () => { await expectLivePreflight(context, "/status/post"); });
});
