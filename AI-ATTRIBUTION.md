## 2026-11-03: package.json, package-lock.json, tweeter-server/package.json (new file), tweeter-server/tsconfig.json (new file), AI-ATTRIBUTION.md (new file)
- Tool: OpenAI Codex
- Task: Set up the tweeter-server workspace with a dependency on tweeter-shared and TypeScript build configuration. Record all file changes using the requested AI attribution format.
- Review: Everything is up to date. New files created and recorded using the AI attribution format.

## 2026-11-03: tweeter-shared/src/model/dto/UserDto.ts (new file), tweeter-shared/src/model/net/request/TweeterRequest.ts (new file), tweeter-shared/src/model/net/request/PagedUserItemRequest.ts (new file), tweeter-shared/src/model/net/response/TweeterResponse.ts (new file), tweeter-shared/src/model/net/response/PagedUserItemResponse.ts (new file), tweeter-shared/src/model/domain/User.ts, tweeter-shared/src/index.ts, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Begin the followers feature by defining shared request and response classes and explicit conversion between User instances and JSON data. Add the required attribution comment to every TypeScript file created or changed.
- Review: All files look accurate. `TweeterRequest` and `TweeterResponse` are the base classes that `PagedItemRequest/Response` use. This is so the interactions between client and server can be defined through the JSON that comes through.

## 2026-11-03: .gitignore, .idea/vcs.xml, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Migrate the existing tweeter-web Git repository to the project root, preserving its history and GitHub remote, and stage the entire project for review without committing. Update ignore rules for generated files in every module and point WebStorm's Git mapping at the project root; move Git metadata from tweeter-web/.git to .git without changing application source files.
- Review: `.gitignore` has appropriate ignore files in it. Review complete.

## 2026-11-03: tweeter-server/src/model/service/FollowService.ts (new file), tweeter-server/src/lambda/follow/GetFollowersLambda.ts (new file), AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Implement the server followers service and Lambda handler, including request validation, user DTO conversion, and FakeData pagination. Add the required TypeScript attribution comments and leave the changes uncommitted for review.
- Review: `FollowService.ts` in the server calls FakeData. This is implementing the database layer, not calling serverFacade. `GetFollowersLambda.ts` formats the validateRequest function in terms that AWS Lambda will be able to understand. Review complete. 

## 2026-11-03: template.yaml (new file), Makefile (new file), tweeter-server/events/get-followers.json (new file), package.json, package-lock.json, .gitignore, README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Set up AWS SAM for the followers feature, including a Lambda and non-proxy REST API template, error mappings, CORS, and a bundled deployment artifact containing tweeter-shared. Install and verify the SAM CLI, document build and deployment steps, and validate the local build without deploying AWS resources.
- Review: `template.yaml` explains what SAM will show for the followers feature. Lambda has already been created, and CORS and error mapping are defined as well on lines 31 and 75-104 respectively.

## 2026-11-03: template.yaml, README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Deploy and test the approved followers backend, and record its deployed URL and verification results. Replace the broad API Gateway fallback error pattern with an explicit check for Lambda error payloads so successful responses use HTTP 200 and unexpected errors use HTTP 500.
- Review: Standard Lambda errors now contain errorMessage; successful page responses do not.

## 2026-11-03: tweeter-web/test/integration/FollowersEndpoint.test.ts (new file), tweeter-web/jest.integration.config.cjs (new file), tweeter-web/package.json, README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Add repeatable Jest integration tests for the deployed followers endpoint, including expected data, pagination, validation errors, and CORS. Configure a separate Node-based integration test command and document how to run it alongside the existing component and presenter tests.
- Review: All tests passing.

## 2026-11-04: tweeter-web/src/net/ClientCommunicator.ts (new file), tweeter-web/src/net/ServerFacade.ts (new file), tweeter-web/src/model.service/FollowService.ts, tweeter-web/test/integration/ServerFacade.test.ts (new file), README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Connect the client followers feature to the deployed backend through ClientCommunicator and ServerFacade, including response validation and User DTO conversion. Add live facade and client service integration tests, document browser verification, and leave changes uncommitted for review.
- Review: ClientCommunicator sends JSON requests and handles HTTP errors. `ServerFacade.ts` validates JSON responses and reconstructs User objects. New tests created for serverFacade. All tests passing

## 2026-11-04: tweeter-server/src/lambda/follow/GetFolloweesLambda.ts (new file), tweeter-server/src/lambda/validation/validatePagedUserItemRequest.ts (new file), tweeter-server/src/lambda/follow/GetFollowersLambda.ts, tweeter-server/src/model/service/FollowService.ts, tweeter-server/events/get-followees.json (new file), tweeter-web/src/net/ServerFacade.ts, tweeter-web/src/model.service/FollowService.ts, tweeter-web/test/integration/Followees.test.ts (new file), tweeter-web/test/server/FollowLambdas.test.ts (new file), template.yaml, Makefile, README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Prepare the followees feature through the server Lambda, SAM API configuration, client facade, and client service, reusing paginated-user validation and response conversion. Add offline handler tests, followees integration tests, a sample request, and documentation before deployment review.
- Review: `validatePagedItemUserRequest` takes on the logic of validating a request for `getFollowersLambda.ts`. **CODEX created duplicate files for getFollowersLambda.ts and getFolloweesLambda.ts so it will be refactored before pushing**  

## 2026-11-04: tweeter-server/src/lambda/PagedUserLambda.ts (new file), tweeter-server/src/lambda/follow/GetFollowersLambda.ts, tweeter-server/src/lambda/follow/GetFolloweesLambda.ts, tweeter-web/test/server/FollowLambdas.test.ts, README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Refactor followers and followees Lambda handling into a shared abstract PagedUserLambda using the Template Method pattern, with subclasses selecting their service operation. Preserve AWS handler exports, add regression tests for service delegation and error propagation, and document the shared flow.
- Review: `PagedUserLambda.ts` created to avoid code duplication - `GetFolloweesLambda.ts` and `GetFollowersLambda.ts` inherit and overwrite `loadPage()` method. All tests passing.

## 2026-11-05: tweeter-web/test/integration/Followees.test.ts, README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Execute the approved followees deployment and shared-handler update, verify both deployed Lambdas, and run all live integration tests. Add explicit variable types in the followees pagination test for the project's Jest TypeScript compiler and update documentation with the successful deployment results.
- Review: Browser check confirms that followees/list shows 10, 10, 1, ends with `hasMore == false` 

## 2026-11-05: tweeter-shared/src/model/net/request/UserAliasRequest.ts (new file), tweeter-shared/src/model/net/response/CountResponse.ts (new file), tweeter-shared/src/model/net/request/PagedUserItemRequest.ts, tweeter-shared/src/index.ts, tweeter-server/src/lambda/validation/validateUserAliasRequest.ts (new file), tweeter-server/src/lambda/validation/validatePagedUserItemRequest.ts, tweeter-server/src/lambda/follow/GetFollowerCountLambda.ts (new file), tweeter-server/src/model/service/FollowService.ts, tweeter-server/events/get-follower-count.json (new file), tweeter-web/src/net/ServerFacade.ts, tweeter-web/src/model.service/FollowService.ts, tweeter-web/test/server/FollowerCountLambda.test.ts (new file), tweeter-web/test/net/ServerFacadeCount.test.ts (new file), tweeter-web/test/integration/FollowerCount.test.ts (new file), template.yaml, Makefile, README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Prepare follower count through shared request/response classes, server validation and Lambda, SAM configuration, and the client facade/service. Reuse token-and-alias fields and validation for paginated requests, add offline and live integration tests, and document the pending deployment and browser check.
- Review: countResponse.ts and additional lambda functions created. Not all tests passing but is consistent with the endpoints that are not yet deployed. Will deploy after this commit.

## 2026-11-05: README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Execute the approved follower-count change set, verify the deployed Lambda and HTTP responses, and run all 20 live integration tests. Update the documented deployment status and overall Milestone 3 checklist without changing application code.
- Review: Browser check shows followers/count reports the correct number of followers as well as status messages including when a user followers another user. All tests passed

## 2026-11-05: tweeter-server/src/lambda/CountLambda.ts (new file), tweeter-server/src/lambda/follow/GetFollowerCountLambda.ts, tweeter-server/src/lambda/follow/GetFolloweeCountLambda.ts (new file), tweeter-server/src/model/service/FollowService.ts, tweeter-server/events/get-followee-count.json (new file), tweeter-web/src/net/ServerFacade.ts, tweeter-web/src/model.service/FollowService.ts, tweeter-web/test/net/ServerFacadeCount.test.ts, tweeter-web/test/server/FollowerCountLambda.test.ts (removed), tweeter-web/test/server/FollowCountLambdas.test.ts (new file), tweeter-web/test/integration/FolloweeCount.test.ts (new file), template.yaml, Makefile, README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Prepare followee count through its Lambda, SAM endpoint, client facade/service, sample request, and integration tests. Share count handling with the Template Method pattern, expand and rename count tests to cover both operations, and document the pending deployment.
- Review: followee count implemented through lambda, SAM, etc. `ServerFacade.ts` deduplicates code by creating a `getCount()` method. ServerFacade looks really good and does the facade job very well.

## 2026-11-05: README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Execute the approved followee-count deployment and verify the direct Lambda response, public route availability, HTTP success/error responses, and all 24 live integration tests. Update the deployment documentation and overall milestone checklist without changing application code.
- Review: Browser check shows everything working as expected. followees/count shows correct number of followees, the right status message, and is persistent when I follow or unfollow someone.

## 2026-11-05: tweeter-shared/src/model/net/request/FollowingStatusRequest.ts (new file), tweeter-shared/src/model/net/response/FollowingStatusResponse.ts (new file), tweeter-shared/src/index.ts, tweeter-server/src/lambda/validation/validateTweeterRequest.ts (new file), tweeter-server/src/lambda/validation/validateUserAliasRequest.ts, tweeter-server/src/lambda/validation/validateFollowingStatusRequest.ts (new file), tweeter-server/src/lambda/follow/GetFollowingStatusLambda.ts (new file), tweeter-server/src/model/service/FollowService.ts, tweeter-server/events/get-following-status.json (new file), tweeter-web/src/net/ServerFacade.ts, tweeter-web/src/model.service/FollowService.ts, tweeter-web/test/server/FollowingStatusLambda.test.ts (new file), tweeter-web/test/net/FollowingStatus.test.ts (new file), tweeter-web/test/integration/FollowingStatus.test.ts (new file), template.yaml, Makefile, README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Prepare following status through shared request/response classes, validation, the server Lambda, SAM endpoint, and client facade/service. Extract shared token validation, test both boolean results and alias direction, and document the pending deployment and browser verification.
- Review: `FollowingStatusRequest/Response.ts` takes care of the request and success response.

## 2026-11-09: README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Execute the approved following-status AWS change set and verify the direct Lambda response, public POST and OPTIONS routes, and all 29 live integration tests. Update the deployment documentation and milestone progress, leaving browser verification for review.
- Review: Browser check correctly shows status information for follower status.

## 2026-11-09: tweeter-server/src/model/service/FollowService.ts, tweeter-server/src/lambda/follow/FollowLambda.ts (new file), tweeter-server/events/follow.json (new file), tweeter-web/src/net/ServerFacade.ts, tweeter-web/src/model.service/FollowService.ts, tweeter-web/test/server/FollowLambda.test.ts (new file), tweeter-web/test/net/Follow.test.ts (new file), tweeter-web/test/integration/Follow.test.ts (new file), Makefile, template.yaml, README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Prepare Follow through the client facade, shared request/response contracts, server service, Lambda, and SAM route. Move the placeholder operation to the server, add offline and pending integration tests, and document deployment and browser verification.
- Review: FollowService allows a user to follow another user. The followLambda will be built and packaged and uploaded to AWS.

## 2026-11-09: README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Execute the approved Follow AWS change set and verify the direct Lambda response, public POST and OPTIONS routes, and all 34 live integration tests after API propagation. Update deployment documentation and milestone progress, leaving the browser check for review.
- Review: Browser check shows follow status POST with correct request and response.

## 2026-11-09: tweeter-server/src/lambda/UserActionLambda.ts (new file), tweeter-server/src/lambda/follow/FollowLambda.ts, tweeter-server/src/lambda/follow/UnfollowLambda.ts (new file), tweeter-server/src/model/service/FollowService.ts, tweeter-server/events/unfollow.json (new file), tweeter-web/src/net/ServerFacade.ts, tweeter-web/src/model.service/FollowService.ts, tweeter-web/test/server/FollowLambda.test.ts, tweeter-web/test/net/Follow.test.ts, tweeter-web/test/integration/Unfollow.test.ts (new file), Makefile, template.yaml, README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Prepare Unfollow through the client service/facade, server service, Lambda, and SAM endpoint, moving the placeholder operation to the server. Share Follow/Unfollow Lambda and facade handling, extend offline tests to cover both operations, add pending live tests, and update deployment documentation.
- Review: Unfollowing logic added to all follow server files. All tests passing.

## 2026-11-09: README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Execute the approved Unfollow AWS change set and verify the direct Lambda response, stable public success/error and preflight responses, and all 39 live integration tests. Update deployment documentation and milestone progress, leaving browser verification for review.
- Review: Browser checks show lambda request and response is as-intended.

## 2026-11-09: tweeter-shared/src/model/net/response/GetUserResponse.ts (new file), tweeter-shared/src/index.ts, tweeter-server/src/model/service/UserService.ts (new file), tweeter-server/src/lambda/user/GetUserLambda.ts (new file), tweeter-server/events/get-user.json (new file), tweeter-web/src/model.service/UserService.ts, tweeter-web/src/net/ServerFacade.ts, tweeter-web/test/server/GetUserLambda.test.ts (new file), tweeter-web/test/net/GetUser.test.ts (new file), tweeter-web/test/integration/GetUser.test.ts (new file), Makefile, template.yaml, README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Prepare Get User through a shared nullable user response, server service and Lambda, SAM route, and client service/facade. Preserve null for unknown aliases, validate and reconstruct user DTOs, add offline and pending live tests, and document deployment and browser verification.
- Review: GetUser function implemented through ServerFacade.ts. 

## 2026-11-09: README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Execute the approved Get User AWS change set and verify the direct Lambda profile, stable public lookup/null/validation and preflight responses, and all 45 live integration tests. Update deployment documentation and milestone progress, leaving manual browser verification and review to the user.
- Review: Browser checks shows everything working as expected.

## 2026-11-09: tweeter-shared/src/model/net/request/TweeterRequest.ts, tweeter-shared/src/model/net/request/AuthenticatedRequest.ts (new file), tweeter-shared/src/model/net/request/UserAliasRequest.ts, tweeter-shared/src/model/net/request/FollowingStatusRequest.ts, tweeter-shared/src/model/net/request/LoginRequest.ts (new file), tweeter-shared/src/model/dto/AuthTokenDto.ts (new file), tweeter-shared/src/model/domain/AuthToken.ts, tweeter-shared/src/model/net/response/AuthenticationResponse.ts (new file), tweeter-shared/src/index.ts, tweeter-server/src/lambda/validation/validateTweeterRequest.ts, tweeter-server/src/lambda/validation/validateUserAliasRequest.ts, tweeter-server/src/lambda/validation/validateFollowingStatusRequest.ts, tweeter-server/src/lambda/validation/validateLoginRequest.ts (new file), tweeter-server/src/model/service/UserService.ts, tweeter-server/src/lambda/user/LoginLambda.ts (new file), tweeter-server/events/login.json (new file), tweeter-web/src/model.service/UserService.ts, tweeter-web/src/net/ServerFacade.ts, tweeter-web/test/server/LoginLambda.test.ts (new file), tweeter-web/test/net/Login.test.ts (new file), tweeter-web/test/integration/Login.test.ts (new file), Makefile, template.yaml, README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Prepare Login through public/authenticated request classes, user/token DTOs, server service and Lambda, SAM endpoint, and client facade/service while preserving dummy login behavior and token storage compatibility. Add offline and pending live integration tests, preserve existing authenticated-request validation, and document deployment and manual verification.
- Review: ServerFacade implements login method. 

## 2026-11-09: README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Execute the approved Login AWS change set and verify the direct Lambda user/token DTOs, stable public success/validation and preflight responses, and all 51 live integration tests, including token reuse for Get User. Update deployment documentation and milestone progress, leaving browser verification and review to the user.
- Review: Login successful on the browser end.

## 2026-11-10: tweeter-shared/src/model/net/request/RegisterRequest.ts (new file), tweeter-shared/src/index.ts, tweeter-server/src/lambda/AuthenticationLambda.ts (new file), tweeter-server/src/lambda/user/LoginLambda.ts, tweeter-server/src/lambda/user/RegisterLambda.ts (new file), tweeter-server/src/lambda/validation/validateRegisterRequest.ts (new file), tweeter-server/src/model/service/UserService.ts, tweeter-server/events/register.json (new file), tweeter-web/src/model.service/UserService.ts, tweeter-web/src/net/ServerFacade.ts, tweeter-web/test/server/RegisterLambda.test.ts (new file), tweeter-web/test/net/Register.test.ts (new file), tweeter-web/test/integration/Register.test.ts (new file), Makefile, template.yaml, README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Prepare Register with Base64 image transport, shared authentication response handling, server validation/service/Lambda, and the SAM endpoint while preserving dummy registration behavior. Add offline and required facade integration tests, verify existing Login behavior, and document pending deployment; AWS change-set preparation awaits renewed CLI login.
- Review: `LoginLambda.ts` now includes an authenticate function to authenticate new users (register). Register created for `ServerFacade.ts`, 

## 2026-11-10: README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Prepare, inspect, and execute the approved Register AWS change set after renewing CLI login. Verify the direct Lambda user/token DTOs, stable public success/validation and preflight responses, and all 58 live integration tests; update deployment documentation and milestone progress while leaving manual review to the user.
- Review: Browser check shows register returns 200 status and Allen Anderson's profile (which is the default profile right now).
