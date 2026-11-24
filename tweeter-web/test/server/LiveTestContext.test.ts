/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AuthToken, User } from "tweeter-shared";
import { buildMilestone4Fixtures } from "../../../tweeter-server/src/tools/milestone4Fixtures";
import { loadLiveTestContext } from "../integration/support/liveTestContext";

let directory: string;
const fixtures = buildMilestone4Fixtures("contexttest", "https://example.com/image.png");
beforeEach(async () => {
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
