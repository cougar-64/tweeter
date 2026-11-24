/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import * as timers from "node:timers/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AuthToken, User } from "tweeter-shared";
import { buildMilestone4Fixtures } from "../../../tweeter-server/src/tools/milestone4Fixtures";
import { loadLiveTestContext, waitForLive } from "../integration/support/liveTestContext";

jest.mock("node:timers/promises", () => ({
  ...jest.requireActual("node:timers/promises"), setTimeout: jest.fn().mockResolvedValue(undefined),
}));

let directory: string;
const fixtures = buildMilestone4Fixtures("contexttest", "https://example.com/image.png");
beforeEach(async () => {
  jest.mocked(timers.setTimeout).mockClear();
  directory = await mkdtemp(join(tmpdir(), "tweeter-live-context-"));
  const path = join(directory, "fixtures.json");
  await writeFile(path, JSON.stringify(fixtures));
  jest.replaceProperty(process, "env", { TWEETER_API_BASE_URL: "https://explicit-test.invalid/dev/",
    TWEETER_TEST_PASSWORD: "fixture-test-password", TWEETER_FIXTURE_PATH: path });
  jest.spyOn(globalThis, "fetch").mockImplementation(async () => { throw new Error("Unexpected network request"); });
});
afterEach(async () => { jest.restoreAllMocks(); await rm(directory, { recursive: true, force: true }); });

it.each(["TWEETER_API_BASE_URL", "TWEETER_TEST_PASSWORD", "TWEETER_FIXTURE_PATH"])("requires explicit %s before network access", async (name) => {
  delete process.env[name];
  await expect(loadLiveTestContext()).rejects.toThrow(`Set ${name}`);
  expect(fetch).not.toHaveBeenCalled();
});

it("rejects a changed manifest before making a login request", async () => {
  await writeFile(process.env.TWEETER_FIXTURE_PATH!, JSON.stringify({ ...fixtures, feed: [] }));
  await expect(loadLiveTestContext()).rejects.toThrow("Fixture manifest differs");
  expect(fetch).not.toHaveBeenCalled();
});

it("keeps fixture loading read-only and cleans up only sessions still tracked after revocation", async () => {
  const context = await loadLiveTestContext();
  expect(fetch).not.toHaveBeenCalled();
  const user = User.fromDto(fixtures.users.reader);
  const first = new AuthToken("first-token", 1000);
  const second = new AuthToken("second-token", 1000);
  const third = new AuthToken("third-token", 1000);
  context.track([user, first]); context.track([user, second]); context.track([user, third]);
  jest.mocked(fetch).mockImplementation(async () => new Response(JSON.stringify({ success: true }), { status: 200 }));
  await context.logout(first);
  context.forgetRevoked(second); // Represents a successful logout through the client service.
  await context.cleanup();
  await context.cleanup();
  expect(jest.mocked(fetch).mock.calls.map(([url, options]) => [url, JSON.parse(String(options!.body))])).toEqual([
    ["https://explicit-test.invalid/dev/user/logout", { token: first.token }],
    ["https://explicit-test.invalid/dev/user/logout", { token: third.token }],
  ]);
});

it("retries successful reads until the follower index converges", async () => {
  const pause = jest.mocked(timers.setTimeout);
  const read = jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValue(["@reader"]);
  await expect(waitForLive<string[]>(read, (items) => items.length === 1)).resolves.toEqual(["@reader"]);
  expect(read).toHaveBeenCalledTimes(3);
  expect(pause).toHaveBeenCalledTimes(2);
});

it("fails explicitly after bounded follower-index reads", async () => {
  const pause = jest.mocked(timers.setTimeout);
  const read = jest.fn().mockResolvedValue([]);
  await expect(waitForLive<string[]>(read, (items) => items.length === 1)).rejects.toThrow("did not converge after 12 reads");
  expect(read).toHaveBeenCalledTimes(12);
  expect(pause).toHaveBeenCalledTimes(11);
});

it("propagates HTTP/storage failures instead of retrying them as index lag", async () => {
  const pause = jest.mocked(timers.setTimeout);
  const error = new Error("HTTP 500");
  const read = jest.fn().mockRejectedValue(error);
  await expect(waitForLive(read, () => true)).rejects.toBe(error);
  expect(read).toHaveBeenCalledTimes(1);
  expect(pause).not.toHaveBeenCalled();
});
