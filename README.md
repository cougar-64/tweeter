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

## Followers Backend with AWS SAM

The root `template.yaml` describes one Lambda and a REST API with
`POST /followers/list`. The handler receives the JSON request directly through a
non-proxy integration. API Gateway returns HTTP 200 for success, 400 for errors
starting with `[Bad Request]`, and 500 for other Lambda errors. CORS is configured
for preflight requests, Lambda responses, and API Gateway errors.

The development stack is `tweeter-m3` in `us-east-1`, with stage `dev`.
Its deployed API base URL is:

```text
https://s58iqa332m.execute-api.us-east-1.amazonaws.com/dev
```

The followers endpoint is `POST /followers/list`. Live checks verified pages of
10, 10, and 1 users, invalid requests returning HTTP 400, and CORS on successful
responses, validation errors, preflight requests, and missing routes.

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
the handler, shared code, and runtime dependencies into
`.aws-sam/build/GetFollowersFunction/GetFollowersLambda.js`. The package does not
depend on workspace symlinks or a separate Lambda layer. TypeScript compilation
checks types before bundling. Generated files are ignored by Git.

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
`Access-Control-Allow-Origin: *` on each response. HTTP mappings and deployed
CORS still need verification against AWS after deployment.

## Client Followers Network Path

Followers is the first feature connected through the client network layer:

```text
FollowerPresenter -> client FollowService -> ServerFacade -> ClientCommunicator -> API Gateway -> Lambda -> server FollowService
```

The client service builds a `PagedUserItemRequest` using the token string and the
last user's DTO. `ClientCommunicator` sends JSON over HTTP and propagates HTTP
errors. `ServerFacade` checks the response fields and converts user DTOs into
`User` instances, preserving getters and methods such as `name` and `equals`.
It returns the `[User[], boolean]` tuple the presenter already expects.

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

## Running Tests

Run the component and presenter tests from the repository root:

```sh
npm test --workspace tweeter-web -- --runInBand
```

Run the deployed followers endpoint integration tests separately:

```sh
npm run test:integration --workspace tweeter-web
```

These tests make real HTTP requests to the development API and require network
access and a deployed backend. They check the expected first page, pagination,
HTTP 400 validation errors, and CORS response headers, including OPTIONS
preflight and an unknown route. They do not emulate a browser enforcing CORS.
The first-page HTTP 200 assertion also guards against the response-mapping
regression found during deployment. No server failure is deliberately injected.

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
The assignment's register, count, and client StatusService story integration
tests will be added as those features are implemented.
