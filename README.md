# Tweeter-Web

A starter project for the Tweeter Web application.

## Setting Up the Project

1. cd into the project root folder
1. Run 'npm install'
1. cd into the tweeter-shared folder
1. Run 'npm install'
1. Run 'npm run build'
1. cd into the tweeter-web folder
1. Run 'npm install'
1. Run 'npm run build'

**Note:** VS Code seems to have a bug. After doing this, you should be able to run the project but code editors report that they can't see the 'tweeter-shared' module. Restarting VS Code fixes the problem. You will likely need to restart VS Code every time you compile or build the 'tweeter-shared' module.

**Note:** If you are using Windows, make sure to use a Git Bash terminal instead of Windows Powershell. Otherwise, the scripts won't run properly in tweeter-shared and it will cause errors when building tweeter-web.

## Rebuilding the Project

Rebuild either module of the project (tweeter-shared or tweeter-web) by running 'npm run build' after making any code or configuration changes in the module. The 'tweeter-web' module is dependent on 'tweeter-shared', so if you change 'tweeter-shared' you will also need to rebuild 'tweeter-web'. After rebuilding 'tweeter-shared' you will likely need to restart VS Code (see note above under 'Setting Up the Project').

## Running the Project

Run the project by running 'npm start' from within the 'tweeter-web' folder.

## Tweeter Backend with AWS SAM

The root `template.yaml` describes follow, user-lookup, and login Lambdas and a REST API
with `POST /followers/list`, `POST /followees/list`, `POST /followers/count`,
`POST /followees/count`, `POST /follow/status`, `POST /follow`, `POST /unfollow`,
`POST /user/get`, and `POST /user/login`.
Each handler receives the JSON request directly through a
non-proxy integration. API Gateway returns HTTP 200 for success, 400 for errors
starting with `[Bad Request]`, and 500 for other Lambda errors. CORS is configured
for preflight requests, Lambda responses, and API Gateway errors.

The development stack is `tweeter-m3` in `us-east-1`, with stage `dev`.
Its deployed API base URL is:

```text
https://s58iqa332m.execute-api.us-east-1.amazonaws.com/dev
```

All nine routes are deployed in this stack.
On 2026-11-09, all 51 live integration tests passed, covering facade and client
service calls, reconstructed User instances, pagination, validation errors, and
CORS. The list Lambdas returned the expected first page when invoked directly,
and the count Lambdas returned valid FakeData counts. The following-status Lambda
also returned a successful boolean response when invoked directly. The Follow
and Unfollow Lambdas returned `success: true` and `message: null` on direct invocation. For `@allen`, each list
returns pages of 10, 10, and 1 dummy users.
The Get User Lambda returned Amy Ames's expected DTO on direct invocation;
public endpoint checks also verified null for an unknown alias, validation
errors, and CORS over three consecutive rounds before running the full suite.
The Login Lambda returned Allen Anderson's DTO and a valid token DTO on direct
invocation. Public Login success, validation errors, and OPTIONS/CORS passed
three consecutive rounds before all 51 live integration tests passed.

The list handlers use
`validatePagedUserItemRequest` to enforce the same paginated-user request
contract. `get-followers.json` and `get-followees.json` contain sample requests.

Follower count is deployed at `POST /followers/count` and verified by live tests.
`UserAliasRequest` contains the token and user alias, and `CountResponse` contains
the success flag, message, and count. `PagedUserItemRequest` extends
`UserAliasRequest` with pagination fields, and its validator reuses the common
token-and-alias checks. The JSON structure of existing list requests is unchanged.

`GetFollowerCountLambda` validates the request, calls the server's
`getFollowerCount`, and returns a `CountResponse`. The client service calls the
facade's `getFollowerCount`, which accepts a nonnegative integer response.
FakeData currently generates a random count from 1 to 10 on each call, so tests
check that range instead of comparing separate requests for equality. Zero is
also a valid count in the response contract and is covered by offline tests.
`tweeter-server/events/get-follower-count.json` contains a sample count request.

Followee count is deployed at `POST /followees/count` and verified by live tests.
It reuses `UserAliasRequest`, `CountResponse`, and the same facade
count-validation helper. Its sample request is
`tweeter-server/events/get-followee-count.json`.

Both count handlers extend `CountLambda`. Its `handle` method validates the
request, calls the subclass's `loadCount` method, and creates the response.
`GetFollowerCountLambda` and `GetFolloweeCountLambda` each choose their matching
server service operation. This is the same Template Method pattern used for
the paginated lists. The exported AWS handler names remain `handler`.

`PagedUserLambda` uses the Template Method pattern: its `handle` method validates
the request, reconstructs the pagination cursor, calls `loadPage`, and constructs
the response DTOs. `GetFollowersLambda` and `GetFolloweesLambda` extend this base
class and implement `loadPage` by calling their respective service methods.
Each Lambda file exports a `handler` function that delegates to its subclass's
inherited `handle` method, matching the existing SAM handler configuration.

Following status is deployed at `POST /follow/status`.
`FollowingStatusRequest` contains `token`, `followerAlias` (the current user), and
`followeeAlias` (the viewed profile). `FollowingStatusResponse` contains
`success`, `message`, and the boolean `isFollower`. A successful response with
`isFollower: false` is valid and means the current user does not follow the
viewed user.

`validateTweeterRequest` checks that a request is an object. The same file's
`validateAuthenticatedRequest` also checks for a nonempty token. Both
`validateUserAliasRequest` and `validateFollowingStatusRequest` reuse the latter before
checking their specific alias fields. This preserves the existing list/count
request formats and error messages. `GetFollowingStatusLambda` delegates to the
server service, which currently uses FakeData's randomized boolean. Aliases are
passed in the correct direction for the eventual relationship lookup.
`tweeter-server/events/get-following-status.json` contains a sample request.

Follow is deployed at `POST /follow`. It reuses `UserAliasRequest` with the
authentication token and target user's `userAlias`, and `TweeterResponse` with
`success` and `message`. No new DTO or response subclass is needed because the
operation returns no additional data. The token represents the acting session;
it is passed through but is not verified in this milestone.
`FollowLambda` extends `UserActionLambda`, whose `handle` method reuses
`validateUserAliasRequest`, awaits `performAction`, and returns success. The
Follow subclass implements `performAction` by calling the server's `follow`
method. The two-second placeholder delay has moved
from the client to the server; no relationship is persisted. The presenter
continues to reload counts afterward, and the component changes the button to
Unfollow on success.
The sample invocation payload is `tweeter-server/events/follow.json`.

Unfollow is deployed at `POST /unfollow`. It uses the same `UserAliasRequest`
and `TweeterResponse` contract as Follow. `UnfollowLambda` extends
`UserActionLambda` and calls the server's `unfollow` method. Its two-second
placeholder operation now runs on the server, with no relationship persistence.
The client facade's `performUserAction` helper shares POST and failure handling
between Follow and Unfollow, while each public method chooses its own endpoint.
The existing presenter reloads counts and the component changes the button to
Follow on success. The sample payload is `tweeter-server/events/unfollow.json`.

Get User is deployed at `POST /user/get`. It reuses `UserAliasRequest` and adds
`GetUserResponse`, which contains `success`, `message`, and `user: UserDto | null`.
The new server `UserService.getUser` looks up the alias in FakeData, while
`GetUserLambda` validates the request and converts a found User to a DTO.
A missing user returns HTTP 200 with `success: true` and `user: null`, preserving
the client service's previous nullable lookup behavior. Invalid requests still
produce HTTP 400; service failures propagate as errors.
ServerFacade validates the returned DTO and reconstructs a User with working
getters and methods. Missing or malformed user data is rejected; only explicit
null means no match. The client `UserService` now accepts an optional facade
for testing and delegates this lookup; its register/logout placeholders
remain for subsequent features. The payload is `tweeter-server/events/get-user.json`.

Login is deployed at `POST /user/login`. `LoginRequest` contains alias and
password and extends the common `TweeterRequest` base without requiring an
existing token. `AuthenticatedRequest` now holds the token for protected
operations; `UserAliasRequest` and `FollowingStatusRequest` extend it, keeping
their existing JSON unchanged. `validateLoginRequest` checks for an object and
nonempty alias/password, preserving the supplied credential strings.

The server `UserService.login` preserves the previous dummy behavior: any
nonempty credentials return the first FakeData user (Allen Anderson) and the
FakeData authentication token. It does not verify passwords or create a real
session. `LoginLambda` returns `AuthenticationResponse` containing a `UserDto`
and `AuthTokenDto` (`token` and `timestamp`). The response contract can also be
used by Register when implemented. ServerFacade validates both DTOs and returns
`[User, AuthToken]` to the client service. `AuthToken.dto` and `fromDto` support
the network conversion; existing `toJson`/`fromJson` storage with `_token` and
`_timestamp` remains unchanged. The sample payload uses dummy credentials in
`tweeter-server/events/login.json`; requests and tokens are not logged by this
implementation. Register and Logout still use client placeholders.

The default response template checks for Lambda's `errorMessage` field and uses
`$context.responseOverride.status` to return HTTP 500 for unexpected errors.
This avoids a broad error regex also selecting successful responses.
[AWS documents response status overrides here](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-override-request-response-parameters.html).
Unexpected-error handling is configured; a server failure has not been
deliberately injected into the deployed Lambda.

Install Node.js 24, npm, make, the AWS CLI, and the
[AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).
Check SAM with `sam --version`. Docker is not needed for this build; SAM's local
Lambda emulation (`sam local invoke`) would require Docker.

Run these commands from the repository root:

```sh
npm ci
sam validate --lint
sam build --build-in-source
```

`--build-in-source` lets the Makefile use the existing npm workspaces without
copying the entire repository and its dependencies into a temporary source tree.
The Makefile compiles shared code before server code, then uses esbuild to bundle
each handler, shared code, and runtime dependencies into
`.aws-sam/build/GetFollowersFunction/GetFollowersLambda.js` and
`.aws-sam/build/GetFolloweesFunction/GetFolloweesLambda.js`, with the count handler
at `.aws-sam/build/GetFollowerCountFunction/GetFollowerCountLambda.js` and
`.aws-sam/build/GetFolloweeCountFunction/GetFolloweeCountLambda.js`. Each package does not
depend on workspace symlinks or a separate Lambda layer. TypeScript compilation
checks types before bundling. Generated files are ignored by Git.
The following-status artifact is
`.aws-sam/build/GetFollowingStatusFunction/GetFollowingStatusLambda.js`.
The follow artifact is `.aws-sam/build/FollowFunction/FollowLambda.js`.
The unfollow artifact is `.aws-sam/build/UnfollowFunction/UnfollowLambda.js`.
The Get User artifact is `.aws-sam/build/GetUserFunction/GetUserLambda.js`.
The Login artifact is `.aws-sam/build/LoginFunction/LoginLambda.js`.

To invoke the built handler directly with Node, without Docker or AWS:

```sh
node -e 'const {handler} = require("./.aws-sam/build/GetFollowersFunction/GetFollowersLambda.js"); handler(require("./tweeter-server/events/get-followers.json")).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error); process.exitCode = 1; });'
```

The sample request should return ten users, beginning with `@amy`, and
`hasMore: true`. For the next page, set `lastItem` to the final item returned by
the previous request. Omitting `token` should reject with `[Bad Request]`.
This checks the packaged handler; it does not exercise API Gateway.

After reviewing the template and choosing the AWS account/profile and region,
deploy with:

```sh
sam deploy --guided
```

Use a stack name such as `tweeter-m3` and the `dev` stage. Keep confirmation of
changes enabled. SAM creates a Lambda execution role with basic logging
permissions, so deployment requires acknowledging IAM role creation. If using a
named AWS profile, add `--profile YOUR_PROFILE` to the deploy command. The generated
`samconfig.toml` saves local deployment choices and is ignored by Git.

The stack outputs include `ApiBaseUrl` and `GetFollowersFunctionName`. First test
the Lambda in the AWS console using `tweeter-server/events/get-followers.json`.
Then replace `YOUR_API_BASE_URL` below with the stack's actual `ApiBaseUrl`:

```sh
curl -i -X POST 'YOUR_API_BASE_URL/followers/list' \
  -H 'Content-Type: application/json' \
  --data-binary @tweeter-server/events/get-followers.json

curl -i -X POST 'YOUR_API_BASE_URL/followers/list' \
  -H 'Content-Type: application/json' \
  --data '{}'

curl -i -X OPTIONS 'YOUR_API_BASE_URL/followers/list' \
  -H 'Origin: http://localhost:5173' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
```

Expect HTTP 200 with followers, HTTP 400 with an `errorMessage`, and a successful
OPTIONS response allowing POST and Content-Type. Check for
`Access-Control-Allow-Origin: *` on each response. To check followees, use
`/followees/list` and `tweeter-server/events/get-followees.json`. Repeat these
checks after changing the API configuration.

## Client Follow Lists Network Path

Followers and followees share the client network layer:

```text
FollowerPresenter / FolloweePresenter -> client FollowService -> ServerFacade -> ClientCommunicator -> API Gateway -> Lambda -> server FollowService
```

The client service builds a `PagedUserItemRequest` using the token string and the
last user's DTO. `ClientCommunicator` sends JSON over HTTP and propagates HTTP
errors. `ServerFacade` checks the response fields and converts user DTOs into
`User` instances, preserving getters and methods such as `name` and `equals`.
It returns the `[User[], boolean]` tuple the presenter already expects.
The facade's `getMoreFollowers` and `getMoreFollowees` methods select their own
endpoints and share a private helper for response validation and DTO conversion.

`ServerFacade` defaults to the deployed development API and accepts another base
URL in its constructor. The client `FollowService` accepts a facade in its
constructor, which lets integration tests select a deployment explicitly.

For a browser check, run `npm start --workspace tweeter-web`, sign in using the
existing dummy login, and open **Followers**. In the browser developer tools,
open Network and filter for `followers/list`. Check that POST requests go to the
deployed API, the first request has `lastItem: null`, and later requests contain
the previous page's final user DTO. For `@allen`, scrolling should retrieve
pages of 10, 10, and 1 followers and then stop. This browser check is separate
from the automated Node integration tests.
Repeat this check in **Followees**, filtering Network
for `followees/list`. The FakeData implementation returns the same dummy pages.

For the follower-count browser check, filter Network for `followers/count` while
opening or refreshing a profile. The request should contain `token` and
`userAlias`; the response should contain `success: true` and an integer `count`.
Check the profile's follower count against that response. Refreshing can change
the count because FakeData generates a new random value.

For the followee-count browser check, repeat the profile check while filtering Network
for `followees/count`. Compare the displayed followee count with the response's
integer `count`. Both count features currently use random FakeData values.

For the following-status browser check, open another user's profile, such as Amy's
while logged in as Allen, and filter Network for `follow/status`. Check that
`followerAlias` is `@allen` and `followeeAlias` is `@amy`. The response should be
HTTP 200 with `success: true` and a boolean `isFollower`: true corresponds to
the **Unfollow** button, and false corresponds to **Follow**. FakeData randomizes
the relationship, so refreshing can change the result and button label; this
does not represent a persisted relationship yet.

For the Follow browser check, open another user's profile and click **Follow**. If the
random status initially shows **Unfollow**, refresh until Follow appears.
Filter Network for the exact `/dev/follow` path: its POST should contain `token`
and the target `userAlias`, then return HTTP 200 with `success: true` and
`message: null`. Count requests should follow, and the button should become
**Unfollow**. Counts and status remain dummy values; they are not evidence of a
stored relationship.

For the Unfollow browser check, click **Unfollow** on another user's profile. You can
click Follow first if needed to show that button. Filter Network for `unfollow`
and confirm a POST to `/dev/unfollow`, with the target `userAlias` and token.
Expect HTTP 200 with `success: true` and `message: null`, subsequent count
requests, and a button change back to **Follow**. Refresh still uses randomized
FakeData for following status.

For the Get User browser check, open Followers or Followees and click Amy's alias to
navigate to her profile. Filter Network for `user/get`. Confirm the POST includes
`userAlias: "@amy"` and a token, and returns HTTP 200 with `success: true`,
`message: null`, and Amy Ames's user DTO. The displayed profile should match.
The integration tests separately verify a nonexistent alias returns null.

For the Login browser check, sign out, open Network, filter for `user/login`, and
sign in with nonempty dummy credentials. Confirm POST `/dev/user/login` sends
alias/password without an existing token and returns HTTP 200 with
`success: true`, Allen Anderson's user DTO, and an `authToken` DTO containing a
nonempty token and numeric timestamp. Confirm the application signs in as Allen,
then open another profile and check subsequent requests carry the returned
token. This tests the request sequence, not real credential/token verification.

## Running Tests

Run the offline component, presenter, facade-validation, and Lambda handler tests from the repository root:

```sh
npm test --workspace tweeter-web -- --runInBand
```

Run all 51 live integration tests separately:

```sh
npm run test:integration --workspace tweeter-web
```

These tests make real HTTP requests to the development API and require network
access and a deployed backend. They check the expected first page, pagination,
HTTP 400 validation errors, and CORS response headers, including OPTIONS
preflight and an unknown route. They do not emulate a browser enforcing CORS.
The first-page HTTP 200 assertion also guards against the response-mapping
regression found during deployment. No server failure is deliberately injected.

To run only the list-feature integration tests:

```sh
npm run test:integration --workspace tweeter-web -- --runTestsByPath test/integration/ServerFacade.test.ts test/integration/FollowersEndpoint.test.ts test/integration/Followees.test.ts
```

`jest.integration.config.cjs` reuses the existing TypeScript transforms but runs
in Node, where fetch is available, rather than the component tests' simulated
browser environment. Each request has a ten-second timeout. The default test
command excludes integration tests so component/presenter tests can run offline.

To test another deployment, override the base URL (including its stage):

```sh
TWEETER_API_BASE_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/dev npm run test:integration --workspace tweeter-web
```

`FollowersEndpoint.test.ts` exercises API Gateway and Lambda directly.
`ServerFacade.test.ts` tests the required GetFollowers facade feature against
AWS, including reconstructed `User` instances, pagination, and error propagation.
It also checks the client `FollowService` path with domain objects as inputs.
`Followees.test.ts` adds followees facade/service pagination, validation errors,
and preflight checks. `test/server/FollowLambdas.test.ts` tests both handlers and
the shared request validation locally, without AWS or HTTP calls.
`FollowerCount.test.ts` adds the required facade count integration test, plus
client service, validation-error, and preflight checks. All four follower-count tests pass
against AWS. `FolloweeCount.test.ts` adds four equivalent tests, also passing
against AWS. `test/server/FollowCountLambdas.test.ts` (renamed from
`FollowerCountLambda.test.ts`) covers both count handlers with shared cases.
The facade count tests also verify that each operation selects the correct URL
and client service method, since random FakeData counts alone cannot distinguish
the two operations. The assignment's register and client StatusService story
integration tests will be added as those features are implemented.

`FollowingStatus.test.ts` in the integration directory provides five passing checks
against the deployed endpoint. The offline server and client following-status tests
cover both true and false results, incorrect result types, alias direction,
request validation, and error propagation. Live status tests accept either
boolean because FakeData is random.

The integration `Follow.test.ts` provides five passing checks against AWS:
successful facade and client service calls, invalid alias/token errors, and
preflight CORS. Offline Follow tests verify that the Lambda waits for the
server operation, passes the correct target, rejects malformed requests before
calling the service, and propagates failures through the client layers.

`Unfollow.test.ts` provides five passing integration checks against AWS: facade and
client service success, invalid alias/token errors, and preflight CORS. The
existing offline `FollowLambda.test.ts` and `test/net/Follow.test.ts` now run
shared cases for both operations. Handler tests also ensure that each operation
calls its own server service method and never the opposite one.

`GetUser.test.ts` provides six passing live checks against AWS: the exact requested
FakeData profile through the facade and service, null for a nonexistent alias,
empty alias/token validation, and preflight CORS. Offline tests cover DTO
conversion, domain reconstruction, missing/malformed response fields, successful
null lookups, and failures. Run tests after `sam build` completes, since building
cleans and regenerates the shared package used by the tests.

`Login.test.ts` provides six passing live checks against AWS: facade and service login results,
using the returned token in Get User, empty alias/password validation, and
preflight CORS. Offline Login tests cover credential forwarding, dummy behavior,
service failures, request validation, missing/malformed user and token fields,
domain reconstruction, and compatibility with existing token storage. Existing
handler tests also ensure the request hierarchy change preserves required-token
validation for authenticated operations.

During Follow deployment, the first live test run received intermittent API
Gateway `Missing Authentication Token` responses even after one successful
request. Once success and validation responses were stable for three consecutive
rounds, all 34 live tests passed without code changes.

## Milestone 3 Progress (2026-11-09)

| Plan item | Status |
| --- | --- |
| Server module with shared dependency | Complete |
| Move all service logic to the server | Nine deployed features; five features remain |
| Shared request/response contracts | Login/authentication DTOs added; registration, logout, and post requests pending |
| First complete feature through all layers | Followers complete, including browser verification |
| Repeat for all 14 features | 9 deployed and verified by live tests; Login and Unfollow browser checks pending |
| Required Jest integration tests | Followers and follower count pass; register and StatusService story tests pending |
| Documentation and passoff | README and AI attribution maintained; submission documents and passoff pending |

Follow is deployed and browser verified. Unfollow is deployed and passes its five
live checks; browser verification is pending. Get User is deployed and browser
verified. Login is deployed and passes all six live checks; browser verification
is pending. The five remaining features are register,
logout, feed, story, and post status. The offline suite has 187 passing tests;
the deployed integration suite has 51 passing tests.
