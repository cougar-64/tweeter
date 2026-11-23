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

The root `template.yaml` describes all fourteen feature Lambdas and a REST API
with `POST /followers/list`, `POST /followees/list`, `POST /followers/count`,
`POST /followees/count`, `POST /follow/status`, `POST /follow`, `POST /unfollow`,
`POST /user/get`, `POST /user/login`, `POST /user/register`, `POST /user/logout`,
`POST /story/list`, `POST /feed/list`, and `POST /status/post`.
Each handler receives the JSON request directly through a
non-proxy integration. API Gateway returns HTTP 200 for success, 400 for errors
starting with `[Bad Request]`, and 500 for other Lambda errors. CORS is configured
for preflight requests, Lambda responses, and API Gateway errors.

The development stack is `tweeter-m3` in `us-east-1`, with stage `dev`.
Its deployed API base URL is:

```text
https://s58iqa332m.execute-api.us-east-1.amazonaws.com/dev
```

All fourteen routes are deployed in this stack.
On 2026-11-10, all 80 live integration tests passed, covering facade and client
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
The Register Lambda returned Allen Anderson's DTO and a valid token DTO on
direct invocation. Public registration success, validation errors, and
OPTIONS/CORS passed three consecutive rounds before the full 58-test suite.
The Logout Lambda returned `success: true` and `message: null` on direct
invocation. Public Logout success, token-validation errors, and OPTIONS/CORS
passed three consecutive rounds before all 62 live tests passed.
The Story Lambda returned ten status DTOs and the expected first post on direct
invocation. Public first-page, validation-error, and OPTIONS/CORS checks passed
three consecutive rounds. The full suite verified all 44 statuses and the final
empty page, including the required client StatusService story test.
The Feed Lambda returned ten status DTOs and the expected first post on direct
invocation. Public Feed first-page, validation-error, and OPTIONS/CORS checks
passed three consecutive rounds before the full 74-test suite verified complete
Feed pagination and the existing Story behavior.
The Post Status Lambda returned `success: true` and `message: null` on direct
invocation. Public posting success, invalid-token and blank-post errors, and
OPTIONS/CORS passed three consecutive rounds before all 80 live tests passed.

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
The client facade's `performAction` helper shares POST and failure handling
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
for testing and delegates this lookup. The payload is `tweeter-server/events/get-user.json`.

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
and `AuthTokenDto` (`token` and `timestamp`). Register uses the same response
contract. ServerFacade validates both DTOs and returns
`[User, AuthToken]` to the client service. `AuthToken.dto` and `fromDto` support
the network conversion; existing `toJson`/`fromJson` storage with `_token` and
`_timestamp` remains unchanged. The sample payload uses dummy credentials in
`tweeter-server/events/login.json`; requests and tokens are not logged by this
implementation.

Register is deployed at `POST /user/register`. `RegisterRequest` contains
`firstName`, `lastName`, `alias`, `password`, `imageStringBase64`, and
`imageFileExtension`. The client UserService encodes its Uint8Array image bytes
as Base64 before calling the facade. It no longer accesses FakeData directly.
`validateRegisterRequest` reuses credential validation from `validateLoginRequest`,
then requires nonempty names, image text, and extension, and checks standard
Base64 syntax. This checks the encoding, not the contents of an image file.
The server `register` preserves the old dummy behavior: it returns Allen Anderson
and a FakeData token, without storing the submitted user or image.

`AuthenticationLambda<REQ>` shares the validate/authenticate/DTO-response sequence
between Login and Register. Each subclass supplies its request validator and
server service call. The facade's private `authenticate` helper shares response
validation and User/AuthToken reconstruction while public login/register methods
select their own endpoints. The sample payload is
`tweeter-server/events/register.json`, containing dummy credentials and a small
Base64 PNG. The reviewed change set was executed after renewing the AWS CLI
login, and the stack update completed successfully.

Logout is deployed at `POST /user/logout`. It reuses `AuthenticatedRequest`
containing only `token`, `validateAuthenticatedRequest`, and `TweeterResponse`.
No new shared contract is needed. `LogoutLambda` validates the request, awaits
the server's one-second simulated `UserService.logout`, then returns success.
The server does not invalidate a stored session in Milestone 3.
The facade reuses `performAction`, which accepts the common authenticated
request type; Follow and Unfollow still send their target aliases. The existing
LogoutPresenter waits for the service before clearing user information and
navigating to Login, and reports errors when the call fails. All methods in the
client UserService now call the server API. The sample request is
`tweeter-server/events/logout.json`.

Story is deployed at `POST /story/list`. `PagedStatusItemRequest` contains the
token, requested user alias, page size, and a nullable `StatusDto` cursor.
`PagedStatusItemResponse` contains status DTOs and `hasMore`. Each `StatusDto`
contains post text, a nested `UserDto`, and a timestamp. The shared `isStatusDto`
predicate validates this JSON shape on both sides, including a finite nonnegative
timestamp and nonempty author alias. Timestamp zero is valid in FakeData.

`PagedStatusLambda` validates the request, reconstructs a Status cursor, calls
its subclass's page loader, and returns DTOs. `GetStoryLambda` calls the new
server `StatusService.loadMoreStoryItems`, which preserves the previous shared
44-status FakeData list; it does not yet filter by user alias. The facade
reconstructs each Status and its author through `Status.fromDto`. The Status
constructor regenerates mention/URL/newline segments, so clickable links and
`equals` continue to work. Existing status storage JSON remains unchanged.
The client StatusService now accepts an optional facade for testing and delegates
Story. The sample payload is
`tweeter-server/events/get-story.json`.

Feed is deployed at `POST /feed/list`. It reuses the status DTOs, paged request/
response contracts, and `PagedStatusLambda` introduced for Story. `GetFeedLambda`
calls the server's separate `loadMoreFeedItems` method. The facade's public
`getMoreStory` and `getMoreFeed` methods choose their own endpoints and share
`getPagedStatuses` for response validation and domain reconstruction. Client
StatusService serializes its null or Status cursor and delegates Feed to the
facade. There are no remaining FakeData references in client service code.

Feed preserves the same shared list of 44 dummy statuses as Story; it is not
yet restricted to posts from followees. Separate service methods allow that
filtering to be added with real storage. The sample payload is
`tweeter-server/events/get-feed.json`.

Post Status is deployed at `POST /status/post`. `PostStatusRequest` extends
`AuthenticatedRequest` with a nested `StatusDto`. The client StatusService sends
the domain status's DTO, preserving post text, author, and timestamp without
serialized display segments. `validatePostStatusRequest` requires a nonempty
token, a valid nested status DTO, and nonblank post text. It checks the DTO's
shape; it does not verify token ownership of the author in this milestone.

`PostStatusLambda` reconstructs the Status and User, awaits the server's
`postStatus`, and returns a base `TweeterResponse`. The two-second simulated
operation now runs on the server; posts are not persisted or added to Feed/Story.
The facade reuses `performAction` for Follow, Unfollow, Logout, and Post Status.
It accepts a complete fallback error message, preserving the older operations'
messages. The existing PostPresenter clears input and shows success after the
service completes; failed requests preserve the input and display an error.
All fourteen client service operations now call the API, with no client service
FakeData access or placeholder delays. The payload is
`tweeter-server/events/post-status.json`.

Every POST integration defines explicit 200, 400, and 500 responses. The 500
selection pattern `(?s)^(?!\[Bad Request\]).+` matches nonempty unexpected Lambda
errors, including multiline messages, while excluding the validation-error
prefix handled by the 400 response. The nonempty match preserves successful
default responses. The 500 mapping returns a generic error message and CORS.
[AWS documents Lambda error selection patterns here](https://docs.aws.amazon.com/apigateway/latest/developerguide/handle-errors-in-lambda-integration.html).
The default response template also checks for Lambda's `errorMessage` field and
uses `$context.responseOverride.status` as a fallback for unexpected errors
without a matching nonempty message.
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
The Register artifact is `.aws-sam/build/RegisterFunction/RegisterLambda.js`.
The Logout artifact is `.aws-sam/build/LogoutFunction/LogoutLambda.js`.
The Story artifact is `.aws-sam/build/GetStoryFunction/GetStoryLambda.js`.
The Feed artifact is `.aws-sam/build/GetFeedFunction/GetFeedLambda.js`.
The Post Status artifact is `.aws-sam/build/PostStatusFunction/PostStatusLambda.js`.

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

For the Register browser check, sign out, open the registration form, fill all fields
with dummy values, and choose an image. Filter Network for `user/register`.
Confirm the POST contains the six registration fields, with the image as a
Base64 string and no existing token. Expect HTTP 200 with `success: true`,
Allen Anderson's user DTO, and an authentication token DTO, followed by sign-in
as Allen. The entered identity and image are not persisted in this milestone.

For the Logout browser check, sign in, enable **Preserve log** in Network, filter for
`user/logout`, and click Logout. Confirm the POST contains only the token and
returns HTTP 200 with `success: true` and `message: null`. The application should
then clear the signed-in user and navigate to Login. Preserve log keeps the
request visible through navigation. This verifies the client logout sequence;
the dummy server does not revoke tokens yet.

For the Story browser check, sign in and open **Story**. Filter Network for
`story/list` and confirm POST requests include the token, alias, page size, and
`lastItem: null` initially. The response should contain ten status DTOs and
`hasMore: true`; the first post is Allen's `Post 0 0`, mentioning Amy and BYU URLs.
Scroll and check later requests send the preceding page's last status DTO.
At page size ten, the five pages contain 10, 10, 10, 10, and 4 statuses, ending
with `hasMore: false`. Check author names, timestamps, mentions, and URL links
render correctly. The dummy list includes multiple authors even on one user's
Story; filtering awaits real storage.

For the Feed browser check, sign in and open **Feed**. Filter Network for `feed/list`,
confirm HTTP 200 with ten status DTOs initially, and scroll to see the last status
DTO passed as the next request's cursor. At page size ten, expect pages of
10, 10, 10, 10, and 4 items and then `hasMore: false`. Check author names,
timestamps, mentions, and links render. The dummy posts currently match Story.

For the Post Status browser check, sign in, filter Network for `status/post`, enter a
message with a mention or URL, and click Post. Confirm the request contains the
token and status DTO, including author and timestamp, and returns HTTP 200 with
`success: true` and `message: null`. The field should clear and the success toast
should appear. The dummy post will not appear in Feed or Story. A whitespace-only
post should return HTTP 400 and leave the input intact.

## Running Tests

Run the offline component, presenter, facade-validation, and Lambda handler tests from the repository root:

```sh
npm test --workspace tweeter-web -- --runInBand
```

Run all 80 live integration tests separately:

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
the two operations. The assignment's Register integration test now passes;
the client StatusService story test also passes against the deployed API.

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

`Register.test.ts` provides seven passing live tests, including the assignment's
required Register ServerFacade integration test. They verify the exact dummy
user/token result, Base64 image transport through the client service, token reuse
with Get User, empty alias/missing image/malformed Base64 errors, and preflight
CORS. Offline Register tests check all six fields, service routing, image byte
encoding, failure propagation, and malformed response DTOs. The Login tests also
pass after extracting shared authentication handling.

`Logout.test.ts` provides four passing live tests against AWS: logging out with a token from
Login through the facade, client service success, empty-token validation, and
preflight CORS. Offline tests check token-only serialization, waiting for server
completion, validation before service calls, and failure propagation. Existing
LogoutPresenter tests verify user information is cleared and navigation occurs
on success, and neither happens after a failed logout.

`Story.test.ts` provides seven passing live tests, including the assignment-required
client StatusService story integration test. It checks the exact first status,
nested User/Status instances and clickable segments, all 44 unique statuses
through facade pagination, the final empty page, invalid token/alias/page size/
cursor errors with HTTP 400 and CORS, and preflight. Offline tests cover DTO and
storage round trips, cursor reconstruction, response validation, service routing,
and error propagation. An isolated packaged-handler check also verified all
five pages and the final empty page.

`Feed.test.ts` provides five passing live checks: exact first-page content through
client StatusService, all 44 unique statuses and the final empty page through
ServerFacade, empty token/alias errors, and preflight CORS. Existing offline
`StoryLambda.test.ts` and `test/net/Story.test.ts` now run their cases for both
features, verifying separate service/endpoint routing as well as shared DTO,
cursor, empty-page, and failure handling. The packaged Feed Lambda was also
checked in isolation through all five pages and the final empty page.

`PostStatus.test.ts` provides six passing live checks: facade and client service
success, empty token/blank post/malformed author errors with HTTP 400 and CORS,
and preflight. Offline tests verify status/author reconstruction, waiting for
server completion, rejection before service calls, failure propagation, and DTO
serialization. Existing PostPresenter tests verify input clearing on success
and preservation on failure. An isolated packaged-handler check also verifies
successful simulated posting and invalid token/post/author rejection.

During Follow deployment, the first live test run received intermittent API
Gateway `Missing Authentication Token` responses even after one successful
request. Once success and validation responses were stable for three consecutive
rounds, all 34 live tests passed without code changes.

## Milestone 3 Progress (2026-11-10)

| Plan item | Status |
| --- | --- |
| Server module with shared dependency | Complete |
| Move all service logic to the server | Complete; all fourteen operations use server APIs |
| Shared request/response contracts | Complete for all fourteen features |
| First complete feature through all layers | Followers complete, including browser verification |
| Repeat for all 14 features | All 14 deployed and verified by live tests; Post Status and Unfollow browser checks pending |
| Required Jest integration tests | Register, Followers, count facade tests and StatusService story test all pass against AWS |
| Documentation and passoff | Submission PDF, project ZIP, and published Swagger export prepared; explicit 200/400/500 integration responses configured; passoff pending |

Follow is deployed and browser verified. Unfollow is deployed and passes its five
live checks; browser verification is pending. Get User is deployed and browser
verified. Login, Register, Logout, and Story are deployed and browser verified.
Feed is deployed and browser verified. Post Status is deployed and passes all
six live checks; browser verification is pending. All fourteen features are now
implemented and deployed. The offline suite has 331 passing tests; the deployed
integration suite has 80 passing tests. All required
Milestone 3 integration tests now pass. Submission documents and the published
API export are available in [docs/milestone-3](docs/milestone-3/README.md).
Passoff work and the final manual browser review remain.

## Milestone 4A: persistence foundation

The database-agnostic contracts are in `tweeter-server/src/model/dao`.
`DAOFactory` supplies user, session, follow, story, feed, and image DAOs to
services. `model/dao/dynamodb/DynamoDBUserDAO.ts` implements user creation and
lookup using an injected document client and table name.
`model/dao/dynamodb/DynamoDBSessionDAO.ts` implements session persistence and
activity refresh with the same injection approach.
`model/dao/s3/S3ImageDAO.ts` implements profile-image uploads and cleanup using
an injected S3 client, bucket name, and region. Other concrete AWS
implementations and service wiring are being added one feature at a time.
Registration, login, logout, and authenticated user lookup now use persistence
in source, as do follow/unfollow, both relationship counts, and following status.
UserService no longer imports FakeData. Other
existing endpoints still use Milestone 3 FakeData or simulated behavior.
No Milestone 4A resources have been deployed.

`model/dao/dynamodb/DynamoDBFollowDAO.ts` now implements the complete FollowDAO
storage contract and is wired into the factory and FollowService's mutations,
counts, and following-status reads.
It receives the shared document client, relationship/user table names, and
optional reverse-index name (default `FollowersIndex`). Only the relationship
list methods still need service/Lambda migration.

The user DAO stores profile fields, a service-supplied password hash, and initial
zero follow counts in a flat item keyed by alias. Conditional creation returns
false if the alias exists, preserving existing data; other database errors
propagate. Strongly consistent lookups return a separate profile DTO, hash, and
counts, or null for a missing alias. Invalid stored records are rejected.
Registration hashes passwords; login compares them with stored bcrypt hashes.
The isolated DAO tests mock the AWS client and do not contact DynamoDB:
`npm test --workspace tweeter-web -- --runInBand test/server/DynamoDBUserDAO.test.ts`.

The session DAO conditionally creates a record without replacing an existing
token digest. Refresh uses a strongly consistent read, rejects missing or
expired sessions, and conditionally updates the activity and expiration against
the values read. Concurrent modifications cause a re-read, with at most three
update attempts before an error. Both times remain monotonic; activity already
covered by the stored timestamps needs no write. Unconditional, idempotent
deletion supports logout, while refresh's existence condition prevents deleted
records from being recreated. All times are whole Unix seconds. The configured
30-minute duration will be supplied by the authorization service; the DAO
accepts the interval as an argument. Isolated tests simulate expiration and
refresh/logout races without contacting AWS:
`npm test --workspace tweeter-web -- --runInBand test/server/DynamoDBSessionDAO.test.ts`.

The image DAO uploads `Uint8Array` bytes under `image/<imageId>` with the supplied
image content type and returns the image ID plus an encoded regional HTTPS URL.
The configured region must match the injected client's region and the bucket's
region; the current URL format targets standard AWS regions. It omits ACLs to
match the bucket policy and uses `IfNoneMatch: '*'` to prevent replacing an
existing image. The caller supplies a unique ID per registration. Cleanup
deletes the same object key and permits repeated deletion in the unversioned
bucket. Invalid path-segment IDs, empty bytes, and non-image content types are
rejected; AWS failures propagate. The content-type check does not inspect image
file contents. Base64 decoding, format selection, ID generation, and registration
cleanup orchestration belong to the registration flow. Isolated tests mock S3:
`npm test --workspace tweeter-web -- --runInBand test/server/S3ImageDAO.test.ts`.

`model/dao/aws/AWSDAOFactory.ts` provides the three implemented authentication
DAOs through the database-agnostic `AuthenticationDAOFactory` interface. The
complete `DAOFactory` extends that smaller interface with follow, story, and
feed factories. The AWS factory also provides FollowDAO; only the story/feed
factory methods remain pending. It has no placeholder implementations.
The factory constructs each DAO once, shares one DynamoDB document client
between user/session/follow storage, and uses a separate S3 client in the same region.
Tests can inject SDK clients. Shared lazy composition caches the factory and
authorization service for user and follow service injection.

`config/AWSConfig.ts` validates configuration when called, without requiring
environment variables at module import. SAM's global function environment
supplies `USERS_TABLE_NAME`, `SESSIONS_TABLE_NAME`, `FOLLOWS_TABLE_NAME`, `PROFILE_IMAGES_BUCKET`, and
`SESSION_INACTIVITY_MINUTES` from stack resources/parameters. Lambda supplies
`AWS_REGION` automatically. Missing or blank resource settings and invalid
inactivity intervals fail explicitly. The timeout defaults to 30 minutes and
is converted to seconds for the upcoming authorization service. No AWS credentials
are stored in configuration; SDK clients use their normal credential provider.
Factory/configuration tests run with:
`npm test --workspace tweeter-web -- --runInBand test/server/AWSDAOFactory.test.ts`.

`model/service/AuthorizationService.ts` receives the session factory interface
and inactivity interval in seconds; it has no AWS dependencies. `createSession`
issues a 32-byte crypto-generated token, persists only its SHA-256 digest, and
returns an `AuthToken` only after persistence succeeds. Call it after successful
registration or credential verification. `authorize` hashes a supplied token,
delegates atomic activity refresh to the session DAO, and returns the session
owner's alias for protected operations. `revokeSession` authenticates the token
before deleting its session. Malformed, missing, revoked, and expired tokens
produce `[Unauthorized] Invalid or expired authentication token.` Storage and
random-generator failures propagate rather than being reported as invalid
credentials. The shared `AuthToken` timestamp remains milliseconds while stored
session activity/expiration are seconds. No insecure random fallback is used.

Registration and login use this service to create sessions, logout uses it
to authenticate and revoke sessions, and user lookup uses it to authorize and
refresh activity. Follow/unfollow also authorize the session before writing.
Relationship counts and following status also authenticate before reading.
Relationship lists and status-post/story/feed operations still need authorization wiring.
All migrated endpoints have 401/CORS mappings
with nonoverlapping 500 patterns; equivalent mappings for other protected
operations remain part of their authentication wiring. All three authentication
Lambdas and user lookup use composition that passes the 30-minute configuration.
Service tests use mock session DAOs plus a stateful in-memory double to exercise
activity refresh, inactivity expiration, and revocation:
`npm test --workspace tweeter-web -- --runInBand test/server/AuthorizationService.test.ts`.

`UserService.register` now checks for an existing alias, hashes the exact password
using bcryptjs with cost 12 (including a generated salt), uploads the decoded
image with a UUID filename, conditionally creates the user, and persists a
session through AuthorizationService before returning the new user/token.
Passwords over 72 UTF-8 bytes are rejected to prevent bcrypt truncation.
Supported image extensions are png, jpg/jpeg, gif, webp, and bmp, with matching
content-type metadata. Extensions are case-insensitive and may start with a dot.
Base64 must be canonical; metadata checks do not inspect the image file itself.
No relationships or feed entries are created for a new account. The actual
blank-feed client experience awaits the feed endpoint's migration from FakeData.

The early alias lookup avoids unnecessary hashing/uploads; conditional user
creation also prevents racing registrations from replacing an existing account.
A confirmed duplicate after upload deletes only that attempt's image. Cleanup
failure produces an infrastructure error retaining both causes. If a user write
throws with an uncertain outcome, the upload remains because the user may have
been saved. A session failure after user creation likewise preserves the account
and photo for subsequent login once the session store recovers. These
failures can leave orphaned uploads or a saved account without a returned
session; multi-resource transactional rollback is not implemented.

`lambda/config/getAWSDependencies.ts` lazily constructs and caches the AWS factory
and authorization service. `getUserService.ts` and `getFollowService.ts` cache
their services using these shared dependencies. RegisterLambda validates before resolving
this composition and also accepts an injected service for tests. Its IAM policy
permits only GetItem/PutItem on UsersTable, PutItem on SessionsTable, and
PutObject/DeleteObject under the bucket's image prefix. Registration has 512 MB
and a 30-second timeout to give bcrypt and persistence enough execution time;
actual AWS latency has not yet been measured. Invalid input/duplicate aliases
use the existing HTTP 400/CORS mapping. Other failures use the generic 500 mapping.

UserService's dependencies remain optional temporarily for unmigrated methods;
registration requires injection and never falls back to FakeData. New service
tests and updated Lambda tests cover persistence delegation, actual bcrypt
verification, automatic sign-in, duplicate races, failures, and cleanup:
`npm test --workspace tweeter-web -- --runInBand test/server/RegistrationService.test.ts test/server/RegisterLambda.test.ts`.
The old live registration integration tests still assert Milestone 3 data and
must be migrated to unique, persisted fixtures before deploying this change.

`UserService.login` now looks up the exact alias, compares the supplied password
with the stored bcrypt hash, reconstructs the public user profile, and creates a
fresh persisted session only on success. Unknown aliases and incorrect passwords
both throw `[Unauthorized] Invalid alias or password.` Overlong passwords are
rejected using registration's 72-byte UTF-8 limit; passwords are never trimmed
before comparison. Lookup, comparison, and session-storage failures propagate
as server errors. Login does not rewrite the user or upload an image.

LoginLambda uses the same cached composition as registration and accepts a
service override for isolated tests. Its IAM policy grants only GetItem on
UsersTable and PutItem on SessionsTable. Like registration, it has 512 MB and a
30-second timeout for bcrypt processing. The API maps malformed requests to 400,
incorrect credentials to 401, and unexpected errors to a generic 500, each with
CORS. The 500 expression excludes both expected error prefixes. Configuration
and regex checks are local; deployed HTTP status codes and CORS still need live
verification. The old live login integration tests still assert Milestone 3
dummy credentials/results and must be migrated before deploying this source.
Login service tests include real bcrypt comparisons, fresh-session persistence,
wrong/missing credentials, exact password handling, and infrastructure failures:
`npm test --workspace tweeter-web -- --runInBand test/server/LoginService.test.ts test/server/LoginLambda.test.ts`.

`UserService.logout` now delegates to AuthorizationService's authenticated
revocation rather than a simulated delay. LogoutLambda validates the request,
resolves the cached AWS user service (or an injected test service), and waits
for deletion before reporting success. Only that token's session is deleted;
other sessions for the same user and sessions for other users remain active.
Subsequent AuthorizationService checks reject the revoked token. Repeated
logout with the same revoked token returns 401 because logout itself requires
authentication, although the underlying DAO deletion operation is idempotent.
Other endpoints will enforce revoked sessions as their authorization is wired.

LogoutFunction has GetItem/UpdateItem/DeleteItem permissions only on
SessionsTable, matching session validation/refresh and deletion. Request-shape
errors map to 400, malformed/expired/unknown/revoked tokens to 401, and storage
failures to a generic 500, all with CORS. Local regex checks verify that expected
400/401 errors do not also match 500. The old live logout tests use dummy tokens
and must be migrated to real sessions before deployment; live status/CORS
behavior has not yet been verified. Service tests use stateful session DAO
doubles to check revocation, session isolation, expiration, and failures:
`npm test --workspace tweeter-web -- --runInBand test/server/LogoutService.test.ts test/server/LogoutLambda.test.ts`.

`UserService.getUser` now authenticates and refreshes the caller's session before
looking up the requested alias in UserDAO. Any signed-in user can view another
user's public profile. Results reconstruct a User using only the public DTO;
password hashes and stored counts are not returned. Missing aliases still return
null successfully. Expired/unknown/revoked tokens are rejected before profile
storage is accessed, including tokens revoked by UserService.logout. Session and
user-store errors propagate instead of being treated as missing users.

GetUserLambda validates before resolving the cached user service and accepts an
injected service for isolated tests. GetUserFunction has GetItem only on
UsersTable and GetItem/UpdateItem only on SessionsTable. Its API mapping returns
400 for malformed request fields, 401 for invalid sessions, and generic 500 for
unexpected failures, all with CORS. Live user-lookup tests still use dummy tokens
and must migrate to authenticated persisted fixtures before deployment. Tests
exercise public-profile reconstruction, lookups of another user, unknown aliases,
activity refresh, expiration, logout revocation, and error propagation:
`npm test --workspace tweeter-web -- --runInBand test/server/GetUserService.test.ts test/server/GetUserLambda.test.ts`.

FollowService's follow/unfollow methods share one mutation helper, which
authenticates the token, obtains the acting alias from its session, rejects
self-follow, and delegates the transaction to FollowDAO. The request supplies
only the target alias. Counts are updated atomically by the DAO; the existing
list endpoints still return FakeData until their migration.
Following does not backfill historical posts, and unfollowing does not remove
existing feed entries. Feed delivery will be added with status posting.

FollowLambda and UnfollowLambda share FollowActionLambda's injected service
resolution and delegation, while UserActionLambda retains request validation
and success-response construction. Both routes map bad requests/missing users
to 400, invalid sessions to 401, and infrastructure errors to generic 500 with
CORS. Their roles allow PutItem (follow) or DeleteItem (unfollow) only on
FollowsTable and GetItem/UpdateItem on UsersTable/SessionsTable. Transaction IAM
permissions use the underlying item actions. No scan/index/S3 permissions are
needed for mutations. The old live mutation tests use dummy tokens and still
need migration before deployment. Shared service/composition tests run with:
`npm test --workspace tweeter-web -- --runInBand test/server/FollowServiceActions.test.ts test/server/FollowLambda.test.ts test/server/AWSComposition.test.ts`.

FollowService's follower/followee count methods now share a count-selection
helper backed by FollowDAO.getCounts. Stored zero counts remain zero; nonexistent
users produce the DAO's bad-request error rather than an invented count. Following
status delegates to the persisted relationship lookup and preserves the supplied
follower-to-followee direction and true/false result. Any authenticated user can
read these public relationship facts. All implemented relationship operations
share one authorization/DAO-access helper; reads wait for session validation and
activity refresh before accessing storage. Errors propagate without fallback data.

The count Lambdas share FollowCountLambda's service resolution/delegation on
top of CountLambda's existing validation/response template. Following-status
handling likewise supports injection and resolves the cached FollowService after
validation. Count roles have GetItem on UsersTable, and following-status has
GetItem on FollowsTable. All three can GetItem/UpdateItem on SessionsTable for
authorization/refresh; none can mutate relationships or user counters. Routes
declare 400/401/500 with CORS and nonoverlapping error patterns. Old live count
and status tests still depend on dummy sessions/data and need migration before
deployment. Local tests cover counter selection, zero counts, relationship
direction, authentication before reads, injection, and infrastructure errors:
`npm test --workspace tweeter-web -- --runInBand test/server/FollowServiceReads.test.ts test/server/FollowCountLambdas.test.ts test/server/FollowingStatusLambda.test.ts`.

| SAM resource | Partition key | Sort key / index | Data |
| --- | --- | --- | --- |
| UsersTable | alias | — | Profile, password hash, follower/followee counts |
| SessionsTable | tokenHash | TTL on expiresAt | Session owner, lastActivity, expiresAt |
| FollowsTable | followerAlias | followeeAlias; FollowersIndex reverses these keys | Relationships |
| StoriesTable | authorAlias | postKey | Author's persisted statuses |
| FeedsTable | ownerAlias | postKey | Precomputed copies of followed authors' statuses |

Tables and the relationship index each provision one read and one write capacity
unit (six of each total). Resource names are generated by CloudFormation to
avoid collisions between stacks. Tables and the image bucket are retained on
stack deletion/replacement. They must be removed separately if no longer needed.
The authentication/relationship resource environment variables are defined globally;
story/feed settings and additional least-privilege permissions will be added as
each concrete DAO is connected. RegisterLambda, LoginLambda, LogoutLambda, and GetUserLambda
now use the AWS factory, as do FollowLambda and UnfollowLambda.

`SessionInactivityMinutes` defaults to 30 and is connected to registration/login's
AuthorizationService. Session times use
whole Unix seconds. Each authenticated operation must atomically check that the
session exists and `expiresAt > now`, then refresh last activity and expiration.
Concurrent refreshes must not shorten expiration, and logout must not allow an
in-flight refresh to recreate a deleted session. Store a hash of the bearer
token. DynamoDB TTL is cleanup, not authorization: expired records can remain
for days, so the server must reject them even before deletion.
See [AWS TTL behavior](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html).

The follow DAO updates the relationship, the follower's followee count, and the
followee's follower count in one transaction. It guards against overwriting a
relationship on follow, deleting a missing relationship on unfollow, creating
nonexistent user rows, negative counts, and integer overflow. A unique transaction
request token supports SDK retries without applying count updates twice. A
confirmed relationship-condition failure becomes a no-op only after checking
both users' stored counts. Counter invariant failures, transaction conflicts,
throttling, missing cancellation details, and other storage failures propagate.
Missing users produce `[Bad Request] User not found.` Self-follow/unfollow is
rejected before sending a transaction; self following-status returns false.

Both mutation directions share one helper, and both list directions share one
query/pagination helper. Followees query the primary table consistently; followers
query the reverse global secondary index with eventual consistency, so its
results can lag recent writes. Counts read the stored user counters with a
projection excluding credentials. List queries retrieve aliases in ascending
order with a one-item lookahead, following internal DynamoDB response boundaries
as needed. The public cursor is the last returned alias, keeping the extra
lookahead item available on the next request. Exhausted pages return null cursors.
Profile lookup remains separate from alias pagination so relationships do not
expose password hashes. Isolated tests exercise commands and simulated database
responses; live transaction atomicity and index behavior remain unverified:
`npm test --workspace tweeter-web -- --runInBand test/server/DynamoDBFollowDAO.test.ts`.

Before milestone completion, review duplication across the completed services,
Lambda composition/handlers, DAO pagination/retries, and test fixtures. The follow
DAO already shares its substantial mutation and query logic; a broader refactor
is deferred until the remaining features are implemented.

Stories and feeds use a fixed-width timestamp followed by a unique status ID
as `postKey`, queried newest first. DAO cursors carry timestamp and status ID,
never DynamoDB key objects. The current API's last-status DTO has no ID: the
status feature will need to carry the ID through shared DTOs and client/server
pagination before these DAOs can be wired. Feed writes will batch recipients,
retry unprocessed writes, and reject incomplete delivery. Reads query stored
feed entries. Part A delivery is synchronous; durable background delivery and
performance improvements belong to Part B.

Profile images use the `image/` prefix in ProfileImagesBucket. A bucket policy
allows public reads only under this prefix. ACLs remain disabled, so the S3 DAO
must omit `ACL` on upload. Account-level public-access restrictions must also
permit this policy for deployment. Each registration uses a unique image ID;
the image DAO supports deleting an upload when registration fails.

Follow behavior is planned to deliver future posts without historical backfill;
unfollowing stops future delivery and retains existing entries. Registration
starts with an empty feed. These defaults can be revised if the course overview
requires different behavior.

The existing Story integration test still targets Milestone 3 FakeData. During
the story feature it will be replaced with authenticated, controlled persisted
fixtures, checking more than ten posts, author isolation, unique pagination,
and terminal empty pages. Additional authentication checks will cover invalid
credentials, expired sessions awaiting TTL cleanup, activity refresh, logout,
and HTTP error responses with CORS.
