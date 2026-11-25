# Tweeter-Web

A starter project for the Tweeter Web application.

Milestone 4A is deployed. The original full suite passed 106 live tests; the clean
passoff reload now passes 77 non-mutating live checks.
See [the persistence section](#milestone-4a-persistence-foundation) for current
status and local test/login settings. Earlier Milestone 3 sections document the
historical dummy-data implementation.

## Current Milestone 4A passoff data

The five Tweeter DynamoDB tables were backed up, cleared, and reloaded for passoff.
Sign in as **@user1** with password **123**. All fourteen fixture accounts use
that deliberately simple test password, with separately salted bcrypt hashes in
DynamoDB. The private, Git-ignored `milestone4-fixtures/live-config.json` has the
current test settings. Old accounts and sessions were removed by the requested
reset; sign in again using the new alias.

| Main account tab | Items |
| --- | ---: |
| Feed | 26 |
| Story | 13 |
| Followers | 12 |
| Followees | 12 |

This gives one account more than ten items in every tab. **@user2** and
**@user3** are the two other authors; **@user4** has empty lists. **@user5**
through **@user14** complete the twelve mutual relationships around @user1.
Display names are User 1 through User 14. Aliases are alphanumeric so existing
in-post mention links work. The version-three public manifest is
`milestone4-fixtures/userpassoff.json`. All 77 passoff checks across ten live suites
passed, including 10+2 relationship pages and 10+3 story pages. A final paced,
consistent database audit matched every fixture profile/counter, relationship,
story/feed snapshot, and the public image bytes; no session rows remained.

Use `npm run test:passoff --workspace tweeter-web` to check authentication and
read/pagination routes without creating permanent test users, relationships, or
posts. It acquires/revokes temporary login sessions. The full `test:integration`
command also runs mutation suites that deliberately create extra users/posts;
avoid that command after preparing the final clean passoff state. Human posting,
following, and unfollowing will likewise change exact snapshot expectations.

The final database contains fourteen users, twenty-four directed follow edges,
thirty-nine story rows, and one hundred eighty-two precomputed feed rows.
The main account receives Alice/Bob's twenty-six posts; its thirteen posts are
also precomputed into the feeds of its twelve followers. The empty account is
isolated. Existing S3 image objects were retained; the new profiles reference a
fresh uploaded fixture image. Only the five CloudFormation-verified application
tables were cleared; their schemas/indexes/TTL remain intact. Owner-only local
backups are under ignored `milestone4-fixtures/backups/`.

A reload at one-unit capacity hit DynamoDB throughput limits. The stack now
provisions 20 read units and 18 write units in total across this project's tables
and index, and administrative seed operations are paced. These project totals
are below the course's 25-unit targets; account-wide usage/charges depend on
other resources. No schema changes or replacements were made. Follow the
[transaction capacity rules](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/read-write-operations.html)
and [GSI capacity guidance](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html)
when changing capacity later. Earlier dataset descriptions below are historical
version-one notes; use this section and the current manifest for passoff counts.

Before passoff, sign into the AWS Console and select **us-east-1**, with the
Tweeter DynamoDB tables, S3 image bucket, and Lambda/API resources easy to open.
Review/commit/push source and attribution edits and submit AI-ATTRIBUTION.md to
the Milestone 4A Documents assignment before passoff, as required by the course.

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
in source, as do all seven relationship endpoints. UserService, FollowService, and StatusService
no longer import FakeData. Status posting persists stories and precomputes feed
copies; story and feed reads now use persistence. All protected endpoints
authenticate and refresh sessions in source.
Milestone 4A is deployed to tweeter-m3/dev in us-east-1 with stack status
UPDATE_COMPLETE. The earlier full suite passed 106 tests; following the requested
reset, all 77 non-mutating passoff checks pass. Version-three namespace userpassoff
contains fourteen accounts, twenty-four follow edges, thirty-nine story entries,
and one hundred eighty-two feed copies. The main @user1 account has
twelve followers, twelve followees, thirteen story posts, and twenty-six feed posts. Additional live checks verified
TTL-expired session rejection, thirty-minute inactivity refresh, hashed bearer
storage, logout revocation, and stored bcrypt password hashes. The user has now
verified browser feed/story scrolling, relationship lists/counts, empty accounts,
profile-image rendering, and wrong-password rejection. Browser signup with a real
image, posting, and follow/unfollow interactions remain for the final UI check;
formal performance/passoff work remains.

`model/dao/dynamodb/DynamoDBFollowDAO.ts` now implements the complete FollowDAO
storage contract and is wired into the factory and FollowService's mutations,
counts, following-status reads, and paged lists.
It receives the shared document client, relationship/user table names, and
optional reverse-index name (default `FollowersIndex`). All relationship service
methods now use this DAO and session authorization.

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
feed factories. AWSDAOFactory now implements the complete DAOFactory interface,
including story and feed creation, without placeholder implementations.
The factory constructs each DAO once, shares one DynamoDB document client
between all five DynamoDB DAOs, and uses a separate S3 client in the same region.
Tests can inject SDK clients. Shared lazy composition caches the factory and
authorization service for user and follow service injection.

`config/AWSConfig.ts` validates configuration when called, without requiring
environment variables at module import. SAM's global function environment
supplies `USERS_TABLE_NAME`, `SESSIONS_TABLE_NAME`, `FOLLOWS_TABLE_NAME`,
`STORIES_TABLE_NAME`, `FEEDS_TABLE_NAME`, `PROFILE_IMAGES_BUCKET`, and
`SESSION_INACTIVITY_MINUTES` from stack resources/parameters. Lambda supplies
`AWS_REGION` automatically. Missing or blank resource settings and invalid
inactivity intervals fail explicitly. The timeout defaults to 30 minutes and
is converted to seconds for the authorization service. No AWS credentials
are stored in configuration; SDK clients use their normal credential provider.
Factory/configuration tests run with:
`npm test --workspace tweeter-web -- --runInBand test/server/AWSDAOFactory.test.ts`.

The story/feed DAOs are cached alongside the other DAOs and use the same injected
document client with distinct configured table names. Factory tests cover both
write paths (story PutItem and feed BatchWriteItem), both query partitions, instance
reuse without AWS requests, and missing/blank configuration for every resource.
StatusService posting and story/feed reads now use these DAOs. PostStatusLambda
has scoped write/query permissions, and GetStoryLambda/GetFeedLambda can query
only their respective status tables. Factory construction itself does not
access either table.

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
Relationship lists, status posting, and story/feed reads also authorize and
refresh sessions. All protected endpoints now have 401/CORS mappings with
nonoverlapping 500 patterns in source. All three authentication
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
No relationships or feed entries are created for a new account. Feed reads
return an empty page for that account; the browser signup/blank-feed experience
still requires browser verification; live registration and empty-feed API checks pass.

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
formal latency/load requirements have not been measured. Invalid input/duplicate aliases
use the existing HTTP 400/CORS mapping. Other failures use the generic 500 mapping.

UserService's dependencies remain optional for existing test construction;
registration requires injection and never falls back to FakeData. New service
tests and updated Lambda tests cover persistence delegation, actual bcrypt
verification, automatic sign-in, duplicate races, failures, and cleanup:
`npm test --workspace tweeter-web -- --runInBand test/server/RegistrationService.test.ts test/server/RegisterLambda.test.ts`.
The live registration suite now uses unique aliases and verifies persisted profiles,
automatic sign-in, empty lists/counts, image bytes from S3, duplicate rejection, and
subsequent login. The deployed suite passes, including public S3 image-byte retrieval.

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
and regex checks are supplemented by passing deployed HTTP status/CORS tests. The live login suite now uses fixture credentials and checks
independent sessions, wrong/missing credentials, and 400/401 CORS responses;
the deployed login suite passes.
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
400/401 errors do not also match 500. The live logout suite now uses real login
tokens and checks that both protected requests and repeated logout fail after
revocation; deployed status/CORS checks now pass. Service tests use stateful session DAO
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
unexpected failures, all with CORS. Live user-lookup tests now use authenticated
persisted fixtures and pass against the deployed API. Offline tests
exercise public-profile reconstruction, lookups of another user, unknown aliases,
activity refresh, expiration, logout revocation, and error propagation:
`npm test --workspace tweeter-web -- --runInBand test/server/GetUserService.test.ts test/server/GetUserLambda.test.ts`.

FollowService's follow/unfollow methods share one mutation helper, which
authenticates the token, obtains the acting alias from its session, rejects
self-follow, and delegates the transaction to FollowDAO. The request supplies
only the target alias. Counts are updated atomically by the DAO and read by the
count endpoints.
Following does not backfill historical posts, and unfollowing does not remove
existing feed entries. Posting now delivers copies to the author's current followers.

FollowLambda and UnfollowLambda share FollowActionLambda's injected service
resolution and delegation, while UserActionLambda retains request validation
and success-response construction. Both routes map bad requests/missing users
to 400, invalid sessions to 401, and infrastructure errors to generic 500 with
CORS. Their roles allow PutItem (follow) or DeleteItem (unfollow) only on
FollowsTable and GetItem/UpdateItem on UsersTable/SessionsTable. Transaction IAM
permissions use the underlying item actions. No scan/index/S3 permissions are
needed for mutations. Live mutation tests now register isolated accounts and check
persisted direction/counters and repeat-request behavior; deployed checks pass. Shared service/composition tests run with:
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
declare 400/401/500 with CORS and nonoverlapping error patterns. Live count/status
tests now assert exact seeded values and relationship direction using real sessions.
They pass against the deployed API. Local tests cover counter selection, zero counts, relationship
direction, authentication before reads, injection, and infrastructure errors:
`npm test --workspace tweeter-web -- --runInBand test/server/FollowServiceReads.test.ts test/server/FollowCountLambdas.test.ts test/server/FollowingStatusLambda.test.ts`.

The followers/followees list methods share an authenticated pagination helper.
It checks the viewed user exists, retrieves aliases from FollowDAO, and loads
public profiles through UserDAO. Concurrent profile reads preserve alias order
using Promise.all. Missing profiles fail the request rather than silently
dropping a cursor row. The DAO's nextCursor becomes the existing hasMore flag;
the last User's alias is used for the next request. No DTO/client changes are
needed. Empty terminal pages return `[[], false]`; an unknown viewed user
produces a bad-request error.

The list Lambdas share FollowPageLambda's service resolution/delegation, retaining
PagedUserLambda's validation, JSON cursor reconstruction, and DTO conversion.
Roles can query FollowsTable, read user profiles, and get/update sessions;
followers additionally has Query permission for the specific FollowersIndex ARN.
Neither role can mutate relationships or user rows. Both routes declare
400/401/500 with CORS and nonoverlapping error patterns. Followers remain
eventually consistent; followees use the primary table.

Local tests pass 13 profiles through each Lambda and serialized JSON cursor in
pages of 10, 3, and 0, check reverse-completion profile reads preserve ordering,
and cover authorization, missing users/profiles, and storage failures:
`npm test --workspace tweeter-web -- --runInBand test/server/FollowServicePages.test.ts test/server/FollowLambdas.test.ts`.
These local fixtures are in-memory. Live list tests now use the seeded reader and
authors with one-item pages to exercise cursors, exact profiles, and terminal empty
pages. Follower reads use bounded index-convergence checks. The thirteen-entry
stories and twenty-six-entry feed support browser scrolling/passoff once seeded;
deployed queries/pagination pass, and the user verified feed/story scrolling in
the browser. Interactive mutation checks remain for the final UI pass.

| SAM resource | Partition key | Sort key / index | Data |
| --- | --- | --- | --- |
| UsersTable | alias | — | Profile, password hash, follower/followee counts |
| SessionsTable | tokenHash | TTL on expiresAt | Session owner, lastActivity, expiresAt |
| FollowsTable | followerAlias | followeeAlias; FollowersIndex reverses these keys | Relationships |
| StoriesTable | authorAlias | postKey | Author's persisted statuses |
| FeedsTable | ownerAlias | postKey | Precomputed copies of followed authors' statuses |

The tables and relationship index now provision twenty read and eighteen write
capacity units in total for reliable passoff browsing and seeding. Resource names are generated by CloudFormation to
avoid collisions between stacks. Tables and the image bucket are retained on
stack deletion/replacement. They must be removed separately if no longer needed.
All five DynamoDB table names and the image bucket are configured globally;
additional least-privilege permissions for status operations will be added as
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
responses. Live sequential mutation/counter/idempotence checks pass and index
convergence was observed; concurrent load/latency has not been measured:
`npm test --workspace tweeter-web -- --runInBand test/server/DynamoDBFollowDAO.test.ts`.

The Milestone 4A duplication review is complete for the current server code.
Repeated page-size/cursor validation now delegates to generic
`lambda/validation/validatePagedItemRequest.ts`, with endpoint-specific DTO guards
and unchanged error messages. Shared `isUserDto` validates both relationship
cursors and nested status authors, so their accepted public user shapes stay in
sync. `lambda/config/createServiceProvider.ts` centralizes lazy service creation
and warm-instance caching; all three service providers supply only their
constructor callback. Configuration and AWS clients are still resolved on first
service use, after Lambda request validation, and failed construction can be
retried on a later call.

Existing substantial reuse remains in place:

| Responsibility | Shared implementation |
| --- | --- |
| Relationship mutations, counts, and lists | FollowService helpers and DynamoDBFollowDAO mutation/query helpers |
| Story/feed reads | StatusService.loadStatuses and StatusPageLambda |
| DynamoDB page filling and lookahead | queryPage, reused for relationships and status storage |
| Story/feed row encoding and public snapshots | DynamoDBStatusStore |
| Feed batching and unprocessed retries | DynamoDBFeedDAO.writeBatch |
| Authentication and activity refresh | AuthorizationService |
| Login/register response conversion | AuthenticationLambda |

User and session DAOs retain separate implementations: conditional account
creation and credential mapping differ from session compare-and-swap refresh and
expiration checks. Their short SDK constructor/request declarations do not warrant
a common DAO superclass. User/status pagination adapters likewise retain their
small, type-specific domain/response conversions. Feature tests retain separate
fixtures and assertions where author/owner and credential/session semantics
differ. API Gateway route response declarations remain explicit for each route;
changing deployment representation is outside this behavior-preserving cleanup.

Stories and feeds use a fixed-width timestamp followed by a unique status ID
as `postKey`, queried newest first. DAO cursors carry timestamp and status ID,
never DynamoDB key objects. StatusDto/Status now preserve optional status IDs
through client/server pagination. New posts and legacy data may omit the ID;
persisted reads supply it. Posting and story/feed reads are wired. The feed DAO
batches recipients,
retries unprocessed writes, and rejects incomplete delivery. Reads query stored
feed entries. Part A delivery is synchronous; durable background delivery and
performance improvements belong to Part B.

`model/dao/dynamodb/DynamoDBStoryDAO.ts` now implements story storage and is provided
by the AWS factory and used by posting and story reads. It writes a public
status/author snapshot under `authorAlias` and `postKey`. Replaying the same
immutable author/timestamp/status-ID record replaces the same key, rather than
adding a duplicate row. Status IDs must be unique per logical post; changing an
existing ID's timestamp is not a supported retry. Story reads query only the
requested author's partition consistently, newest first. IDs break timestamp
ties, including ties spanning page boundaries.

`DynamoDBStatusStore.ts` shares status encoding, key construction, validation,
public-field copying, and page retrieval for story/feed storage. Keys use a
16-digit nonnegative safe-integer millisecond timestamp followed by `#` and a
1–128 character ASCII letter/digit/underscore/hyphen ID. Returned cursors expose
only timestamp/ID. Malformed records, mismatched timestamps/keys, or cross-author
story rows fail explicitly rather than returning corrupted data. The DAO accepts
an already-authenticated author snapshot; StatusService posting now supplies it.

`queryPage.ts` now shares the DynamoDB pagination loop between relationship and
story storage. It fills a page plus one lookahead across internal response
boundaries, then returns a cursor for the last visible item. The feed DAO also
uses these helpers without copying the query/row-handling code.
New isolated tests cover 13 statuses, timestamp ties across the 10-item boundary,
author isolation, identical replays, internal pagination, public-field copying,
malformed input/storage, and failures. Existing relationship pagination tests
also pass after extraction:
`npm test --workspace tweeter-web -- --runInBand test/server/DynamoDBStoryDAO.test.ts test/server/DynamoDBFollowDAO.test.ts`.
These tests use mocked SDK responses and an in-memory row map, not DynamoDB.

`StatusDto` has an optional readonly `statusId`, and `PersistedStatusDto` requires
it. Shared `isStatusId`, `isStatusDto`, and `isPersistedStatusDto` guards validate
ID shape and nonnegative safe-integer millisecond timestamps. Status exposes an
immutable ID through its optional fourth constructor argument/getter. DTO and
local-storage JSON conversions preserve existing IDs without generating them.
Legacy DTOs/JSON and new unsaved posts remain ID-free with their original shape.
Identified statuses compare identity by their globally unique ID; ID-free legacy
statuses retain their original author/timestamp/post equality. An identified
status is distinct from an otherwise identical legacy status.

The shared status store includes its authoritative record ID in persisted status
DTOs, normalizes older nested payloads missing that ID, and rejects a conflicting
nested ID rather than returning ambiguous cursors. ID shape validation is shared
with the API/domain layer. Client story/feed services, facade reconstruction,
Lambda DTO conversion, and last-item JSON requests retain IDs without changing
their existing request/response containers. Guards still accept legacy data but
reject malformed supplied IDs and fractional/unsafe timestamps. Posting now
generates server IDs; story reads require a persisted ID and matching author on
nonnull cursors. Feed cursors also require persisted IDs, but allow authors
different from the feed owner. Clients do not invent IDs on conversion.
Model and transport tests run with:
`npm test --workspace tweeter-web -- --runInBand test/model/StatusIdentity.test.ts test/net/Story.test.ts test/server/StoryLambda.test.ts`.

`model/dao/dynamodb/DynamoDBFeedDAO.ts` now stores precomputed public status
snapshots under each recipient's `ownerAlias` and the shared post key. It retains
the original author, deduplicates recipient aliases, validates the status and all
recipients before writing, and makes repeated delivery of the same immutable
timestamp/globally unique status ID idempotent per recipient. Empty recipient
lists issue no writes. Feed reads query only the owner's persisted entries;
they never calculate a feed from follow relationships or author stories.

Writes use sequential batches of at most 25 items and at most 16 MB of request
body data, measured after DynamoDB type marshalling and JSON escaping using
`@aws-sdk/util-dynamodb`. Individual DynamoDB item-size/key restrictions still
apply and SDK failures propagate. A batch retries only UnprocessedItems, with
five total attempts and exponential delays with jitter between attempts. Exhausted
retries fail explicitly and stop later batches. Retryable thrown errors use the
injected SDK client's retry policy; exhausted SDK errors also propagate. Delivery
can therefore be partial on failure; replay the same immutable status to safely
retry completed and incomplete recipients. Durable fan-out recovery remains
Part B work. Tests inject a pause function rather than waiting for retry timers.

The feed DAO is provided by the AWS factory and used by posting and feed reads. Tests
cover 24 feed-specific cases, including 25-item/16-MB batch boundaries, duplicate
recipients, partial retry progress/exhaustion, and mixed-author owner-isolated
pagination through 13 statuses as pages of 10, 3, and 0:
`npm test --workspace tweeter-web -- --runInBand test/server/DynamoDBFeedDAO.test.ts`.
Separate live suites now verify delivery and persisted story/feed pagination. Jest's TypeScript transform now
explicitly includes Node and Jest types alongside the existing Vite types, so
mixed client/server test runs can resolve Node modules consistently. All 801
offline tests pass with `npm test --workspace tweeter-web -- --runInBand`.

`StatusService.postStatus` now authorizes the token, loads the session owner's
stored profile, and constructs one immutable post snapshot using the submitted
text, a server UUID, and server millisecond time. Client author/profile, timestamp,
and ID are ignored for persistence. It saves the story first, pages through the
author's followers in groups of 100, and awaits FeedDAO.putEntries for each page.
The feed DAO splits those writes into safe batches/retries. Every recipient
receives the same post ID, timestamp, and author snapshot. Authors with no
followers still get a story entry without feed writes. A repeated follower cursor
fails explicitly rather than looping indefinitely.

Posting success waits for all requested feed delivery. Cross-table/fan-out work
is not atomic: a failure after the story write retains that story and any completed
feed copies, and the request returns an error. There is no durable pending-delivery
job yet. Replaying an immutable record is safe at the DAO level; repeating the
entire HTTP post command creates a new server ID and can create another post.
Follower discovery uses the eventually consistent reverse index. Actual AWS
delivery and index convergence were verified with isolated live accounts;
high-follower latency remains unmeasured.

`lambda/config/getStatusService.ts` caches the injected service using the same
factory/authorization dependencies as user/follow services. PostStatusLambda
validates before composition, supports service injection, and waits for posting
completion. Its role can read the user profile, get/update sessions, put stories,
query the follows table/FollowersIndex, and batch-write feeds. Its timeout is now
30 seconds for synchronous delivery. Invalid requests map to 400, invalid sessions
or a missing session-owner account to 401, and storage/delivery errors to generic
500, all with CORS and nonoverlapping selection patterns.

Posting tests cover authoritative metadata, unique IDs at equal timestamps,
113 followers across multiple pages, empty follower lists, pending delivery,
authentication/storage failures, and partial-delivery errors:
`npm test --workspace tweeter-web -- --runInBand test/server/PostStatusService.test.ts test/server/PostStatusLambda.test.ts`.
These use mocked DAOs, not AWS. Live posting tests now use isolated registered
accounts and verify authoritative metadata, synchronous follower delivery, and
retained entries after unfollow. Those deployed tests pass. All StatusService
operations now use persistence.

`StatusService.loadMoreStoryItems` now authenticates and refreshes the session,
checks that the requested author exists, and calls StoryDAO.getStory with only
the author alias, page size, and optional timestamp/status-ID cursor. Any signed-in
user may view another user's story. A valid account with no posts returns an
empty page; a missing author returns 400. Nonnull cursors require a valid persisted
ID, a nonnegative safe-integer timestamp, and the requested author's alias. Cursor
text/profile fields are not used to locate the page, and timestamp ties retain
separate post identities. Responses reconstruct Status/User objects from the
stored public snapshot and derive hasMore from the DAO continuation cursor.
No follow/feed reads or per-post profile lookups are needed.

GetStoryLambda validates the request before resolving the cached status service,
and supports an injected service for testing. Its role can read profiles,
get/update sessions, and query only StoriesTable. The story route now maps
400/401/500 errors with CORS and nonoverlapping selection patterns. Unit tests
cover authorization ordering/failures, another author's story, missing/empty
accounts, JSON pagination across 13 equal-timestamp posts as pages of 10/3/0,
invalid/legacy/cross-author cursors, snapshot reconstruction, continuation flags,
and storage failures:
`npm test --workspace tweeter-web -- --runInBand test/server/StoryService.test.ts test/server/StoryLambda.test.ts test/server/AWSComposition.test.ts`.
These local tests use mocks; the separate deployed DynamoDB/API Gateway suites
now pass. Browser story/feed pagination and empty-list behavior were subsequently
verified by the user.

`StatusService.loadMoreFeedItems` now authenticates/refreshes the session,
checks that the selected feed owner exists, and queries only FeedDAO.getFeed
using the owner's alias and timestamp/status-ID cursor. The selected user's
feed is viewable by any authenticated user, matching the existing user-tab UI.
Stored snapshots retain each post's original author; cursor authors may differ
from the feed owner. The owner always supplies the query partition. Missing
owners return 400, existing owners with no entries return an empty page, and
invalid sessions return 401. Reads do not consult follows or stories, rebuild
feeds, fetch per-post profiles, or write feed entries. Unfollow therefore stops
future delivery without removing previously stored entries.

Story/feed reads share a private loadStatuses operation for authorization,
owner lookup, identity validation, public snapshot reconstruction, and hasMore.
The story-specific cursor author check remains intact. Both Lambdas extend
StatusPageLambda, which shares optional service injection and cached composition
while PagedStatusLambda handles request validation and DTO conversion. The generic
service type preserves injection of a single operation. GetFeedLambda's role can
read users, get/update sessions, and query only FeedsTable. Feed 400/401/500
responses all include CORS with nonoverlapping selection patterns.

Feed tests cover mixed-author snapshots, owner-scoped cursor reuse, JSON pages
of 10/3/0 across 13 equal-timestamp records, no relationship/story reads or writes,
empty/missing owners, invalid/legacy cursors, continuation flags, authentication,
and storage errors. Story tests also run against the shared implementation:
`npm test --workspace tweeter-web -- --runInBand test/server/FeedService.test.ts test/server/StoryService.test.ts test/server/StoryLambda.test.ts test/server/AWSComposition.test.ts`.
No server source uses FakeData now. Story/feed live tests now use persisted fixtures;
login, registration, logout, and user lookup have also been migrated.
Relationship and posting live suites have also been migrated. The duplicate legacy
ServerFacade follower suite was consolidated into the follower endpoint suite.
Seeded data, API pagination, and user-reported browser tab/scrolling checks pass.
The server duplication review is documented above.

Profile images use the `image/` prefix in ProfileImagesBucket. A bucket policy
allows public reads only under this prefix. ACLs remain disabled, so the S3 DAO
must omit `ACL` on upload. Account-level public-access restrictions must also
permit this policy for deployment. Each registration uses a unique image ID;
the image DAO supports deleting an upload when registration fails.

Follow behavior is planned to deliver future posts without historical backfill;
unfollowing stops future delivery and retains existing entries. Registration
starts with an empty feed. These defaults can be revised if the course overview
requires different behavior.

Story/Feed integration tests now share `test/integration/support/persistedStatusSuite.ts`.
They require an explicit API URL, a generated fixture manifest, and the fixture
password. They log in through the real API and revoke their own session afterward;
no dummy tokens, default deployed endpoint, or hard-coded passwords remain in
these two suites. Tests compare exact persisted snapshots, pagination and IDs,
author/owner isolation, empty pages, invalid-token 401, malformed/legacy-cursor 400,
and CORS/preflight behavior. Login, Register, Logout, and GetUser also use persisted
fixtures through `test/integration/support/liveTestContext.ts`. This shared context
loads and validates explicit configuration/manifest data, tracks acquired sessions,
and revokes only sessions still active at cleanup. All fourteen route suites share
HTTP error/CORS and browser preflight checks. Offline context tests verify missing
configuration and modified manifests fail before network access and cleanup does
not repeat revoked sessions.

The account suites check stored credentials/profiles, independent sessions,
wrong-password/unknown-alias 401s, logout revocation and reuse rejection, unique
registration, automatic sign-in, blank story/feed and zero relationship counts,
public S3 image bytes, duplicate-alias preservation, subsequent login, validation,
and CORS. Registration creates two uniquely named accounts and images per run;
they remain because there is no account-deletion endpoint. Tests revoke their
sessions and do not change the seeded public fixture snapshots. The PNG bytes
are shared with the seed tool. All of these live API checks now pass.

Relationship suites now share mutation, count, and pagination runners. Counts and
following status assert exact fixture state, including zeros and reverse/self
relationships. List checks cover public profiles through endpoint/facade/service,
JSON cursors, one-item pages, empty accounts, terminal pages, and errors/CORS.
The follower endpoint retains API Gateway unknown-route CORS coverage. Redundant
legacy ServerFacade follower tests were consolidated into that suite.

Follow/unfollow tests create isolated actor/target pairs, check both counter
changes and directed state, repeat operations to verify idempotence, and cover
self/missing-target rejection and 400/401/preflight. Posting tests use a separate
author/reader pair and wait for follower-index convergence before posting and
after unfollow. They check that client author/time/ID are replaced, a successful
post is immediately present in the reader's precomputed feed, unfollow stops
future delivery, and earlier entries remain. Feed reads after successful posting
are not retried, so missing synchronous delivery fails the test.

Only successful follower reads with lagging expected data are retried: twelve
reads maximum with 250 ms between reads. HTTP/authentication/storage failures
propagate immediately. Offline tests cover convergence, exhaustion, and error
propagation using mocked pauses. The full live run creates eight unique accounts
and images (two registration, four relationship mutation, two posting), plus
four posts/two feed copies. It revokes sessions and removes test relationships;
accounts/images/posts remain because deletion endpoints do not exist. Seeded
reader/author profiles, relationships, stories, and feed snapshots stay unchanged.

All fourteen route suites pass against the deployed API: 106 tests, zero failures.
No dummy credentials, FakeData assumptions, or fallback hard-coded API URL remain
under `test/integration`. The previous forty-five setup failures were caused by
missing configuration, before HTTP calls. After deployment/seeding the full run
passed with explicit environment settings. The normal integration command also
now loads the private, ignored `milestone4-fixtures/live-config.json` when all
three test settings are absent. If any setting is explicitly supplied, no local
fallback is used; provide all three together to avoid mixing another API target
with saved credentials. Missing both environment settings and a private config
still fails setup. The login suite was rerun through this normal command and all
eight tests passed without manually exported test settings.

The private config contains the explicitly chosen fixture password and deployed resource
names; its file permissions are 0600 and the fixture directory is Git-ignored.
Read environment.TWEETER_TEST_PASSWORD there for browser login as
@user1 (password 123 for these test accounts). The public fixture manifest contains no password/token.
Local logs/results are in ignored `.aws-sam/milestone4-live-tests.log` and
`.aws-sam/milestone4-live-results.json`.

Additional live session/storage verification passed using temporary session rows:
TTL is enabled on expiresAt, an expired row still awaiting cleanup is rejected
with 401/CORS, a near-expiry valid session refreshes to thirty minutes, raw bearer
tokens are not stored, logout deletes the row and blocks reuse, and the reader's
stored bcrypt cost-twelve hash verifies without a plaintext password field.
Temporary rows were removed afterward; a consistent scan confirmed zero remaining
sessions. The local audit script/log are in ignored
`.aws-sam/milestone4-session-audit.cjs` and `.aws-sam/milestone4-session-audit.log`.
The user subsequently verified browser feed/story scrolling, profile navigation,
exact counts/lists, empty accounts, placeholder images, and wrong-password errors.
Browser registration/posting/follow/unfollow checks and performance/load passoff
remain; the corresponding API integration tests already pass.

Deployment preparation now includes `samconfig.example.toml`. It proposes updating
`tweeter-m3` in us-east-1 with stage dev and a thirty-minute inactivity timeout;
check the stack/region before copying it to the Git-ignored samconfig.toml. It
keeps change-set confirmation enabled and selects source builds. The configured
local profile testUser initially authenticated with STS but lacked CloudFormation
access. After the user attached deployment policies, DescribeStacks succeeds for
tweeter-m3 in us-east-1: the stack is UPDATE_COMPLETE and its dev API URL matches
the client. The existing SAM artifact bucket is reused. The S3 account-level
public-access-block lookup reports no configured block; actual bucket-policy
creation succeeded; live registration tests retrieved the public PNG bytes.

The first approved change set, samcli-deploy1795553059, failed because
PutRolePolicy/DeleteRolePolicy permissions were missing, leaving rollback blocked.
After IAMFullAccess was actually attached and confirmed, normal rollback completed
without skipping resources. The five retained tables and image bucket were
verified empty and absent from the recovered template, then removed under the
user's cleanup authorization. All six old physical resources were subsequently
verified absent. No unrelated resources or existing user data were deleted.

Retry change set samcli-deploy1795553682 was compared programmatically against
the approved resource actions and parameters and matched exactly. It executed
successfully; the stack is UPDATE_COMPLETE, the original dev API URL is preserved,
and the five tables/image bucket/policy are active. Archived reviews and deployed
outputs are in ignored `.aws-sam/milestone4-change-set.json`,
`.aws-sam/milestone4-retry-change-set.json`, and
`.aws-sam/milestone4-deployed-stack.json`. The explicit seed succeeded, followed by
the full live verification above. Immediately after the automated run, table counts were twelve users,
two relationships, thirty story entries, twenty-eight feed entries, and zero
sessions, matching the seed plus isolated live-test data and cleanup.

Use the existing source-build mode for this npm workspace:

```sh
cp -n samconfig.example.toml samconfig.toml
sam build --build-in-source --template-file template.yaml
sam validate --lint --template-file template.yaml
```

A plain temporary-copy build failed locally because copied node_modules command
links lost the package context needed by rimraf. Source builds preserve workspace
links and successfully package all fourteen handlers. Avoid parallel source
builds/tests that clean/recompile the same shared dist folder. Generated build
artifacts remain ignored by Git. See the official [SAM build options](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-build.html).

Once the AWS deployment profile is configured and the local stack/region choices
are checked, prepare a reviewable change set using:

```sh
sam deploy --template-file .aws-sam/build/template.yaml --config-file "$PWD/samconfig.toml" --profile YOUR_DEPLOYMENT_PROFILE --no-execute-changeset
```

This uploads artifacts and records a CloudFormation change set without executing
the application changes; SAM may also provision its managed artifact bucket.
Review the actual operations/replacements before applying the deployment. This
review-only command succeeded using testUser; the initial execution failed on IAM
permissions, then the identical approved retry succeeded after recovery. The [SAM deploy reference](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-deploy.html)
documents the change-set option. Keep confirm_changeset enabled when applying.
The template retains data tables and the image bucket and currently provisions
twenty RCUs/eighteen WCUs across the five tables and one GSI, as detailed in the
current passoff setup above.
Actual account capacity/charges and S3 public-policy constraints require checking
against the target account at deployment time.

After successful deployment, stack outputs provide these nonsecret seed settings:

| Stack output | Local environment variable |
| --- | --- |
| DeploymentRegion | AWS_REGION |
| UsersTableName | USERS_TABLE_NAME |
| SessionsTableName | SESSIONS_TABLE_NAME |
| FollowsTableName | FOLLOWS_TABLE_NAME |
| StoriesTableName | STORIES_TABLE_NAME |
| FeedsTableName | FEEDS_TABLE_NAME |
| ProfileImagesBucketName | PROFILE_IMAGES_BUCKET |
| ApiBaseUrl | TWEETER_API_BASE_URL |

Retrieve them through the stack's Outputs tab or aws cloudformation describe-stacks
using the deployment-capable profile, then proceed to the explicit seed below.
Passwords and AWS credentials are not stack outputs or committed configuration.

`src/tools/milestone4Fixtures.ts` builds a versioned deterministic fixture plan.
`src/tools/seedMilestone4.ts` persists it through the DAOFactory interfaces;
`src/tools/seedMilestone4CLI.ts` supplies AWS composition and an explicit write mode.
The default dry run does not load AWS configuration, access AWS, hash passwords,
or create files. After building, preview with:

```sh
npm run build --workspace tweeter-server
npm run seed:milestone4 --workspace tweeter-server -- --namespace m4a20261123
```

The version-three plan reserves @user1 through @user14, creates twenty-four
directed relationships, and thirteen posts each for User 1, User 2, and User 3
(including timestamp ties). The namespace distinguishes status IDs and image keys;
it does not change these fixed account aliases.
Reader has twenty-six feed entries and twelve followers/followees. Each of those
twelve peers receives Reader's thirteen posts in its precomputed feed. There is
also an isolated empty account and one shared public one-pixel PNG in S3. Each account gets a separately salted bcrypt hash
of TWEETER_TEST_PASSWORD. No sessions are seeded. Feed copies are written directly
through FeedDAO so index propagation cannot change the expected fixtures; this
seed does not verify live API posting/fan-out or registration.

After deploying Milestone 4A, configure the following environment variables with
that stack's actual resource names before explicitly writing fixtures:
AWS_REGION, USERS_TABLE_NAME, SESSIONS_TABLE_NAME, FOLLOWS_TABLE_NAME,
STORIES_TABLE_NAME, FEEDS_TABLE_NAME, and PROFILE_IMAGES_BUCKET. Use your normal
AWS credential provider with permission for user GetItem/PutItem, relationship
transactions and user-counter updates, story PutItem, feed BatchWriteItem, and
S3 PutObject. Set TWEETER_TEST_PASSWORD to a test password of 1-72 UTF-8 bytes,
without placing credentials in the manifest or repository. Then, from the repo root:

```sh
mkdir -p milestone4-fixtures
export TWEETER_FIXTURE_PATH="$PWD/milestone4-fixtures/m4a20261123.json"
npm run seed:milestone4 --workspace tweeter-server -- --namespace m4a20261123 --write --output "$TWEETER_FIXTURE_PATH"
```

The command refuses existing account aliases before uploads/writes, uses conditional
account creation to catch races, and never overwrites an existing output manifest.
Generated manifests are ignored by Git and contain only public fixtures, not
passwords or tokens. These fixed aliases must be absent before another run; a
new namespace alone cannot avoid account collisions. Writes are not a
cross-service transaction: failure may leave accounts, relationships, posts/feed
entries, or an uploaded image. Incomplete runs remove the reserved output file and
return failure, without deleting potentially committed data. There is no automatic
cleanup/reset; explicitly review and clean up partial test resources before
retrying. Avoid concurrent seed runs, since they share the reserved aliases.
Keep these fixture accounts read-only while running exact-snapshot tests.

On this workspace the following command reads the generated private live config.
On another workspace, set TWEETER_API_BASE_URL, TWEETER_FIXTURE_PATH, and
TWEETER_TEST_PASSWORD together (or supply the same explicit local config):

```sh
npm run test:integration --workspace tweeter-web
```

For browser scrolling verification, sign in as the manifest's reader account
using the fixture password: its Feed should show 26 entries. Visit an author's
Story for 13 entries, and the empty account for empty lists. This setup satisfies
the data prerequisite for a tab with more than ten items: the explicit seed has
succeeded, and S3 delivery, API errors/CORS, and pagination passed live tests.
The user has now confirmed rendering/scrolling and the expected seeded counts,
empty lists, images, and wrong-password error in the browser. Registration with a
real image, posting, follow/unfollow UI interactions, and formal performance/passoff
checks remain. Running the full live suite again creates another set of isolated
test accounts/images/posts; it preserves the baseline seeded snapshots.

During the final browser review, persistent error toasts were traced to a zero
expiration duration. MessageHooks now gives errors a five-second duration; Toaster's
existing sweep removes them automatically. Progress messages explicitly using zero
still remain until the operation removes them, and manual close remains available.
The Toaster component regression test exercises error expiry alongside persistent
progress and manual dismissal. Previously created zero-duration alerts may require
one manual close or a refresh after updating the client.

A newly registered account has no people in its lists yet. There is no search box,
but the existing authenticated profile route accepts a known alias: keep the current
frontend origin and open `/story/@user2` to view User 2 and use Follow.
Sign in with Remember Me enabled before changing the address bar: this performs
a full reload, and the provider restores authentication from local storage only
when the login was remembered. With Remember Me off (the default), authentication
is held in memory and a reload returns to sign-in. After signing in with Remember
Me enabled, enter the profile URL again.
ItemScroller already resolves its route alias through authenticated user lookup.
Unfollow after testing to restore the fixture's original relationship counts.
No user-search UI or server search endpoint was added.

The user subsequently confirmed remembered-login navigation to Alice, following
her, posting as Alice, and seeing that future post delivered to the follower's
feed. That confirms the browser follow/post/feed path. A final browser check of
unfollow preventing a subsequent post, registration with a real photo, and the
new five-second error dismissal remains unless already checked by the user.
Manual mutations of the seeded Alice/reader data change the exact manifest
expectations (story/feed entries and relationship counts). Before rerunning the
full exact-fixture suite, restore the prepared snapshot through a deliberate
backup/reset/reseed or update test expectations for the intended mutations; do not
diagnose legitimate extra manual posts/followers as an application regression.
The new passoff reset supersedes that manually modified version-one baseline;
use the version-three manifest and current counts at the top of this document.
