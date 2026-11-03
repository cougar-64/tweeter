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
