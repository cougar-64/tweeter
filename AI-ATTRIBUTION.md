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

## 2026-11-10: tweeter-server/src/model/service/UserService.ts, tweeter-server/src/lambda/user/LogoutLambda.ts (new file), tweeter-server/events/logout.json (new file), tweeter-web/src/model.service/UserService.ts, tweeter-web/src/net/ServerFacade.ts, tweeter-web/test/server/LogoutLambda.test.ts (new file), tweeter-web/test/net/Logout.test.ts (new file), tweeter-web/test/integration/Logout.test.ts (new file), Makefile, template.yaml, README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Prepare Logout through the client service/facade, server service and Lambda, and SAM endpoint using the existing token-only request and base response. Move the simulated operation to the server, test validation/completion/failure behavior and the pending live endpoint, and update deployment documentation and progress.
- Review: Logout implemented through ServerFacade. UserService.ts calls ServerFacade.ts logout method which uses AWS to tell the UserService.ts in the server to logout the user. LogoutLambda also created for AWS deployment. 

## 2026-11-10: README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Execute the approved Logout AWS change set and verify the direct Lambda response, stable public success/token-validation and preflight responses, and all 62 live integration tests. Update deployment documentation and milestone progress while leaving browser verification and review to the user.
- Review: When the user logs out, the browser responds with a 200 status that shows the user logged out successfully and also goes back to the login page. All tests are passing.  

## 2026-11-10: tweeter-shared/src/model/dto/StatusDto.ts (new file), tweeter-shared/src/model/domain/Status.ts, tweeter-shared/src/model/net/request/PagedStatusItemRequest.ts (new file), tweeter-shared/src/model/net/response/PagedStatusItemResponse.ts (new file), tweeter-shared/src/index.ts, tweeter-server/src/lambda/validation/validatePagedStatusItemRequest.ts (new file), tweeter-server/src/model/service/StatusService.ts (new file), tweeter-server/src/lambda/PagedStatusLambda.ts (new file), tweeter-server/src/lambda/status/GetStoryLambda.ts (new file), tweeter-server/events/get-story.json (new file), tweeter-web/src/model.service/StatusService.ts, tweeter-web/src/net/ServerFacade.ts, tweeter-web/test/server/StoryLambda.test.ts (new file), tweeter-web/test/net/Story.test.ts (new file), tweeter-web/test/integration/Story.test.ts (new file), Makefile, template.yaml, README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Prepare Story through status DTOs and paged contracts, server service/Lambda, SAM route, and client facade/service while preserving the shared dummy status list. Reconstruct status authors and clickable segments, validate cursors and responses, add offline and required StatusService integration tests, and document pending deployment and milestone progress.
- Review: Story implemented through serverFacade and statusService. Tests written as well, lambda ready for AWS upload.

## 2026-11-10: README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Execute the approved Story AWS change set and verify the direct Lambda first page, stable public success/validation and preflight responses, and all 69 live integration tests. Confirm complete 44-status pagination and the required client StatusService story test, and update deployment documentation and milestone progress while leaving browser verification to the user.
- Review: Browser status shows status response 200 and the correct amount of stories displayed.

## 2026-11-10: tweeter-server/src/model/service/StatusService.ts, tweeter-server/src/lambda/status/GetFeedLambda.ts (new file), tweeter-server/events/get-feed.json (new file), tweeter-web/src/model.service/StatusService.ts, tweeter-web/src/net/ServerFacade.ts, tweeter-web/test/server/StoryLambda.test.ts, tweeter-web/test/net/Story.test.ts, tweeter-web/test/integration/Feed.test.ts (new file), Makefile, template.yaml, README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Prepare Feed through its server service/Lambda, SAM endpoint, and client service/facade using Story's existing status paging contracts. Share facade handling, extend offline tests to verify separate Feed/Story routing, add pending live Feed tests, and document dummy behavior and deployment progress.
- Review: Feed implemented through serverfacade and status service. lambda ready to upload to AWS.

## 2026-11-10: README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Execute the approved Feed AWS change set and verify the direct Lambda first page, stable public success/validation and preflight responses, and all 74 live integration tests. Confirm complete Feed pagination and existing Story behavior, and update deployment documentation and milestone progress while leaving browser verification to the user.
- Review: Browser check shows response status 200 and the correct amount of posts (feed) displayed.

## 2026-11-10: tweeter-shared/src/model/net/request/PostStatusRequest.ts (new file), tweeter-shared/src/index.ts, tweeter-server/src/lambda/validation/validatePostStatusRequest.ts (new file), tweeter-server/src/lambda/status/PostStatusLambda.ts (new file), tweeter-server/src/model/service/StatusService.ts, tweeter-server/events/post-status.json (new file), tweeter-web/src/model.service/StatusService.ts, tweeter-web/src/net/ServerFacade.ts, tweeter-web/test/server/PostStatusLambda.test.ts (new file), tweeter-web/test/net/PostStatus.test.ts (new file), tweeter-web/test/integration/PostStatus.test.ts (new file), Makefile, template.yaml, README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Prepare Post Status through a shared token/status request, server validation/service/Lambda, SAM endpoint, and client service/facade while preserving simulated posting. Share action response handling without changing existing errors, test DTO transport and completion/failure behavior, add pending live tests, and update documentation and the final-feature checklist.
- Review: Posting a status is deployed through server facade as well as both status services (web and server). Lambda ready for upload

## 2026-11-10: README.md, AI-ATTRIBUTION.md
- Tool: OpenAI Codex
- Task: Execute the approved final Post Status AWS change set and verify the direct Lambda response, stable public success/validation and preflight responses, and all 80 live integration tests across fourteen features. Update deployment documentation and milestone progress while leaving final browser review, submission documents, API export, and passoff preparation outstanding.
- Review: Browser check shows 200 OK status and success toast deleting. Everything looks good. 

## 2026-11-17: Milestone 3 submission documents
- Tool: OpenAI Codex
- Task: Trace the current status-posting implementation and create a UML sequence diagram PDF, SVG preview, editable PlantUML, and a reproducible renderer. Include the client/server StatusService objects, API Gateway JSON bridge, promise completion, and the listener's success message.
- Task: Prepare a reproducible project ZIP using current versionable files; extract a clearly labeled local Swagger reference from the SAM template; document the remaining stage export and documentation publication steps.
- Findings: All fourteen source POST methods have descriptions and declare 200/400/500 method responses. HTTP 500 uses a response-template override rather than a separate 500 integration response; this was flagged for rubric review. The AWS stage export could not be completed because the AWS login session expired. No AWS configuration was changed.
- Validation: Compared diagram calls with PostStatus, PostPresenter, both StatusService implementations, ServerFacade, ClientCommunicator, PostStatusLambda, validation helpers, and the SAM integration. Checked the rendered diagram, source endpoint coverage, and ZIP integrity. Application code was not changed by this documentation task.
- Review: Generated documents look good! Sequence diagram is correct and thorough, and readme correctly instructs how to see milestone 3 completion.

## 2026-11-17: Published API documentation and stage export
- Tool: OpenAI Codex
- Task: After the student renewed AWS authentication, export the deployed dev-stage API, inspect its documentation, complete documentation publication, and rebuild the submission ZIP.
- Changes: Retained the existing fourteen POST method descriptions, added descriptions to the fourteen CORS OPTIONS methods, and published documentation version `m3-docs-20261117` to `dev`. Exported the actual stage as `docs/milestone-3/swagger.aws.json` with integration extensions. Updated the submission checklist and packager validation. Consulted the official AWS documentation-import reference to prepare the documentation-only merge.
- Validation: Confirmed the stage's documentation version, descriptions and integration extensions for all fourteen POST and fourteen OPTIONS methods, and declared 200/400/500 POST method responses in the exported file. The runtime deployment remained `m0wxqb`. Rebuilt and verified the current project archive. No runtime integrations or application code were changed; endpoint tests were not rerun.
- Remaining issue: The actual deployed export confirms that HTTP 500 is produced through the default response-template override; a separate 500 integration response is absent. This remains flagged against the rubric.
- Review: Artifacts look good, now need to do the HTTP 500 response.

## 2026-11-17: Explicit HTTP 500 integration responses
- Tool: OpenAI Codex
- Task: Add and deploy a separate HTTP 500 integration response for every application POST endpoint, verify existing behavior, and refresh the submission artifacts.
- Changes: Added the selection pattern `(?s)^(?!\[Bad Request\]).+` to all fourteen POST integrations in `template.yaml`. It matches nonempty unexpected errors, including multiline messages, and excludes the validation prefix handled by HTTP 400. Each 500 response returns a generic JSON error and CORS. Retained the default-template override as a fallback. Updated submission validation, both READMEs, and the exported Swagger file.
- Deployment: Retrieved the original deployed CloudFormation template and reused its existing Lambda artifact locations. Verified that the proposed template changed only the fourteen integration responses. Reviewed and executed change set `m3-explicit500-20261117`, whose resource changes were limited to the REST API, stage, and API deployment. The stack reached UPDATE_COMPLETE, and dev now uses deployment `iv9v59` with documentation version `m3-docs-20261117` retained. No Lambda or IAM changes were made.
- Validation: `sam validate --lint --template-file template.yaml` passed. Local selection-rule checks covered empty, validation, unexpected, and multiline messages without overlapping 400/500 matches. All 80 live integration tests across 15 suites passed after deployment. The actual refreshed stage export contains all fourteen explicit 200/400/500 integration response sets and all twenty-eight method descriptions. Rebuilt and verified the project ZIP. A server failure was not deliberately injected into deployed Lambdas; the 500 checks verified configuration and selection rules.
- Sources: Consulted the official AWS Lambda error handling documentation: https://docs.aws.amazon.com/apigateway/latest/developerguide/handle-errors-in-lambda-integration.html
- Review: HTTP 500 response implemented. Milestone 3 complete.

## 2026-11-19: Milestone 4A DAO contracts and storage design
- Tool: OpenAI Codex
- Task: Prepare the complete database-agnostic DAO interfaces and SAM table/S3 definitions for review before implementing one feature at a time. Use the student's approved 30-minute inactivity window with TTL cleanup and explicit server expiration enforcement.
- Changes: Added `tweeter-server/src/model/dao/DAOModels.ts`, `DAOFactory.ts`, `UserDAO.ts`, `SessionDAO.ts`, `FollowDAO.ts`, `StoryDAO.ts`, `FeedDAO.ts`, and `ImageDAO.ts`, each with an AI attribution comment. Added five provisioned DynamoDB tables, a reverse relationship index, session TTL, a session-duration parameter, and a profile-image bucket with a prefix-scoped public-read policy in `template.yaml`. Extended `README.md` with the schema, operation contracts, planned feature sequence, and remaining work. Updated this log.
- Scope: Foundation only; concrete DAOs, authentication behavior, Lambda wiring, and integration-test migration are pending. No AWS deployment or Git commit performed.
- Validation: Server TypeScript build, SAM template lint validation, and `git diff --check` passed. SAM also reported a sandbox permission warning while attempting to write its global metadata outside the workspace; template validation completed successfully with exit code 0.
- Sources: Official AWS TTL documentation: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html and https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ttl-expired-items.html
- Review: All DAO classes implemented. DAO factory is literally just the dependency injection we did in class. Template.yaml added 5 DynamoDB tables. ![DB tables](DB.png)

## 2026-11-19: DynamoDB user DAO
- Tool: OpenAI Codex
- Task: Implement and verify only the concrete DynamoDB user DAO as the next reviewable milestone increment; leave changes uncommitted.
- Changes: Added `tweeter-server/src/model/dao/dynamodb/DynamoDBUserDAO.ts` with an injected document client/table name, conditional unique-alias creation, zero initial counts, strongly consistent lookup, explicit profile/credential mapping, malformed-record checks, and propagation of infrastructure errors. Added `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb` to `tweeter-server/package.json` and updated `package-lock.json`. Added `tweeter-web/test/server/DynamoDBUserDAO.test.ts` using the existing Jest setup and a mocked AWS client. Updated `README.md` and this log. New TypeScript files include AI attribution comments.
- Validation: `npm run build --workspace tweeter-server` passed. All 11 tests passed with `npm test --workspace tweeter-web -- --runInBand test/server/DynamoDBUserDAO.test.ts`. `git diff --check` passed. These are isolated client-mock tests; no live database writes or AWS deployment were performed. The first test run exposed Jest typing issues with overloaded SDK methods; switching mocks to async implementations resolved them.
- Scope: User persistence implementation only. Password hashing, session/image DAOs, factory implementation, service wiring, and live registration verification remain for later increments. No Git commit or push performed.
- Sources: Official AWS SDK v3 document-client guidance and conditional-write/consistent-read examples: https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/migrate-dynamodb-doc-client.html and https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_dynamodb_code_examples.html
- Review: DBUserDAO implemented. Client (DB) puts the new user into the DB if it doesn't exist, or returns the existing user if it exists.

## 2026-11-19: DynamoDB session DAO
- Tool: OpenAI Codex
- Task: Implement and verify the DynamoDB session DAO as a separate reviewable milestone increment, including TTL expiration enforcement, sliding activity refresh, and deletion for logout.
- Changes: Added `tweeter-server/src/model/dao/dynamodb/DynamoDBSessionDAO.ts` with an injected client/table name, conditional session creation, strongly consistent reads, explicit expiration checks, monotonic activity/expiration updates, compare-and-swap conditions, bounded contention retries, idempotent deletion, and record/time validation. Added `tweeter-web/test/server/DynamoDBSessionDAO.test.ts` with 30 isolated tests, including simulated competing refreshes and logout between read and update. Both new TypeScript files include attribution comments. Updated `README.md` and this log.
- Validation: `npm run build --workspace tweeter-server` passed. All 41 tests across both DAO suites passed with `npm test --workspace tweeter-web -- --runInBand test/server/DynamoDBSessionDAO.test.ts test/server/DynamoDBUserDAO.test.ts`. `git diff --check` passed. Tests mock the AWS client; concurrency scenarios simulate responses and verify conditional commands rather than exercising a live database. Initial compilation caught a TypeScript interface/index-signature mismatch; passing an explicit record copy resolved it.
- Scope: Session persistence only. Token generation/hashing, the 30-minute configuration, AuthorizationService, factory wiring, and Lambda authentication remain for subsequent increments. No AWS deployment, Git commit, or push performed.
- Sources: Official AWS conditional-update reference and TTL update guidance: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateItem.html and https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/example_dynamodb_UpdateItemConditionalTTL_section.html
- Review: DBSessionDAO implemented. Can create a new session, TTL is 30 minutes unless refresh is called. After 30 minutes the session expires and is deleted.

## 2026-11-19: S3 image DAO
- Tool: OpenAI Codex
- Task: Implement and verify the S3 image DAO as the next separate milestone increment, including profile-image upload, image URL creation, cleanup deletion, and AWS error propagation.
- Changes: Added `tweeter-server/src/model/dao/s3/S3ImageDAO.ts` with an injected S3 client/bucket/region, raw-byte uploads under `image/`, image content-type metadata, encoded regional HTTPS URLs, conditional writes preventing image-ID overwrite, and deletion for registration cleanup. Uploads omit ACLs to match the existing BucketOwnerEnforced bucket and public-read policy. Added ID/nonempty-byte/content-type validation. Added `@aws-sdk/client-s3` in `tweeter-server/package.json` and updated `package-lock.json`. Added `tweeter-web/test/server/S3ImageDAO.test.ts` with 22 isolated tests; both new TypeScript files include attribution comments. Updated `README.md` and this log.
- Validation: `npm run build --workspace tweeter-server` passed. All 63 tests across the image, user, and session DAO suites passed with `npm test --workspace tweeter-web -- --runInBand test/server/S3ImageDAO.test.ts test/server/DynamoDBUserDAO.test.ts test/server/DynamoDBSessionDAO.test.ts`. `git diff --check` passed. Tests mock the AWS clients; no live S3 upload, public URL access check, or deletion was performed.
- Scope: Image persistence only. Base64 decoding, unique ID generation, image format selection, registration cleanup orchestration, factory wiring, permissions, and deployment remain for subsequent increments. The content-type check validates the supplied metadata rather than the file contents. No AWS deployment, Git commit, or push performed.
- Sources: Official AWS SDK v3 PutObject and DeleteObject references: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/command/PutObjectCommand/ and https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/command/DeleteObjectCommand/
- Review: ImageDAO implemented. Can upload a new image, delete an image, and there is also an image key to get the imageID and make sure that the image is uploaded when regestering.

## 2026-11-20: AWS factory and configuration
- Tool: OpenAI Codex
- Task: Implement the AWS factory and validated deployment configuration as the next separate milestone increment, preparing the implemented user/session/image DAOs for authentication service injection.
- Changes: Added `tweeter-server/src/model/dao/AuthenticationDAOFactory.ts`, `model/dao/aws/AWSDAOFactory.ts`, and `config/AWSConfig.ts`. Updated the complete `DAOFactory.ts` to extend the authentication subset, preserving all six factory methods. The concrete AWS factory supplies the three implemented authentication DAOs without placeholder follow/story/feed methods, reuses instances and clients, and accepts injected SDK clients for tests. Configuration validates required resource names/region and positive whole-minute inactivity, defaulting to 30 minutes converted to seconds. Added shared SAM function environment variables referencing the user/session tables, profile-image bucket, and inactivity parameter. Added `tweeter-web/test/server/AWSDAOFactory.test.ts` with 20 tests. Updated `README.md` and this log. New/modified TypeScript files retain attribution comments.
- Validation: Server TypeScript build and SAM template lint validation passed. Factory/configuration tests and all existing DAO tests passed (83 tests total). `git diff --check` passed. The initial factory test run required an explicit Node type reference because the web test compiler limits included global types; that reference and explicit process imports resolved the compilation errors. SAM validation exited successfully but reported a sandbox warning when writing global metadata outside the workspace.
- Scope: Factory/configuration preparation only. Services and Lambdas still use the previous behavior. AuthorizationService, password hashing, IAM data permissions, and runtime wiring remain for later increments. No AWS requests, deployment, Git commit, or push performed.
- Sources: Official AWS Lambda client reuse/environment guidance and SAM globals reference: https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html and https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-specification-template-anatomy-globals.html
- Review: `AWSDAOFactory.ts` and `AWSConfig.ts` created. Configs loads in the user from the databsase and factory creates the user, session, and image and returns them. 

## 2026-11-20: Authorization service
- Tool: OpenAI Codex
- Task: Implement AuthorizationService as a separate milestone increment with secure token creation, digest-only session storage, activity-based validation/refresh, authenticated revocation, and isolated tests.
- Changes: Added `tweeter-server/src/model/service/AuthorizationService.ts`, receiving the session factory subset and inactivity interval through dependency injection with no AWS dependencies. It generates 32 cryptographically random bytes encoded as a 64-character hexadecimal bearer token, stores a SHA-256 digest, preserves the client's millisecond AuthToken timestamp while using seconds in storage, and returns the authenticated session owner. Invalid/expired tokens produce a stable `[Unauthorized]` prefix for future API mappings. Logout support authorizes before deletion. Storage and secure-generator failures propagate. Added `tweeter-web/test/server/AuthorizationService.test.ts` with 28 tests, including a stateful lifecycle test. Both files include attribution comments. Updated `README.md` and this log.
- Validation: Server TypeScript build passed. AuthorizationService tests plus all existing DAO/factory tests passed (111 tests total). `git diff --check` passed. Tests use mocks and an in-memory SessionDAO double; no AWS requests were made.
- Scope: Service implementation only. Credential verification/password hashing, calls from existing services/Lambdas, AWS permissions, and API Gateway 401/CORS integration remain for subsequent increments. No deployment, Git commit, or push performed.
- Sources: Official Node.js crypto documentation for randomBytes and createHash: https://nodejs.org/docs/latest-v24.x/api/crypto.html
- Review: AuthorizationService implemented. Allows for creating a session, revoking a session, as well as authorizing a session and hashing tokens.

## 2026-11-20: Persistent registration and automatic sign-in
- Tool: OpenAI Codex
- Task: Implement registration with bcrypt password hashing, S3 profile-image upload, conditional user persistence, automatic session creation, Lambda dependency injection, and focused tests as the next milestone increment.
- Changes: Replaced FakeData registration in `tweeter-server/src/model/service/UserService.ts` with injected DAO/AuthorizationService calls, early duplicate lookup plus conditional creation, cost-12 salted bcrypt hashing, a 72-byte UTF-8 password limit, canonical Base64 decoding, extension/content-type mapping, unique image IDs, and duplicate-race cleanup. Other UserService methods remain pending migration. Added cached lazy composition in `tweeter-server/src/lambda/config/getUserService.ts` and connected `RegisterLambda.ts`, supporting injected test services. Added bcryptjs and the requested @types/bcryptjs in `tweeter-server/package.json`/`package-lock.json`. Updated RegisterFunction in `template.yaml` with scoped database/image permissions, 512 MB memory/30-second timeout, and accurate API descriptions. Added `tweeter-web/test/server/RegistrationService.test.ts` (28 tests) and updated `RegisterLambda.test.ts` for real-service delegation instead of dummy registration assumptions. Updated `README.md` and this log. New/modified TypeScript files include attribution comments.
- Validation: Server TypeScript build passed. All 334 tests across 16 server suites passed, including actual bcrypt hashing/password verification, automatic session persistence, duplicate races, failure propagation, and cleanup behavior. RegisterLambda bundled successfully with esbuild for Node 24 (temporary output under /tmp). SAM lint validation and `git diff --check` passed. The initial Lambda test run used the browser test environment and encountered an AWS SDK browser-export parse error; selecting the Node environment for this server test resolved it. SAM also reported its existing sandbox warning for global metadata writes outside the workspace.
- Limitations: Tests mock AWS; no live user/image/session writes or deployment occurred. Confirmed duplicate races clean up the new upload, but uncertain user-write failures retain the image to avoid deleting a potentially saved profile's photo. Session failures preserve the committed account/image. Login/logout persistence, protected endpoint authorization, feed behavior, and live registration integration-test migration remain pending. Existing live registration tests still target the deployed Milestone 3 backend. No Git commit or push performed.
- Sources: Official bcryptjs documentation for salted hashing, async APIs, and the 72-byte password limit: https://github.com/dcodeIO/bcrypt.js
- Review: Implemented getUserService.ts. UserService.ts no longer uses FakeData but actually puts the user in the database. 

## 2026-11-22: Persistent login and credential verification
- Tool: OpenAI Codex
- Task: Implement login using persisted users and bcrypt password verification, issue a new session only for matching credentials, and prepare the Lambda/API configuration as the next separate milestone increment.
- Changes: Replaced FakeData login in `tweeter-server/src/model/service/UserService.ts` with injected user lookup, async bcrypt comparison, the same 72-byte UTF-8 limit as registration, exact password preservation, public profile reconstruction, and AuthorizationService session creation. Unknown aliases and incorrect passwords share `[Unauthorized] Invalid alias or password.` Updated `tweeter-server/src/lambda/user/LoginLambda.ts` to use cached AWS composition and support injected test services. Updated LoginFunction in `template.yaml` with GetItem permission only on UsersTable, PutItem only on SessionsTable, 512 MB memory/30-second timeout, and accurate method documentation. Added login's explicit 401/CORS mapping and excluded both expected prefixes from its 500 selection rule. Added `tweeter-web/test/server/LoginService.test.ts` (16 tests) and updated `LoginLambda.test.ts` to replace dummy behavior assumptions. Updated `README.md` and this log. Changed/new TypeScript files retain AI attribution comments.
- Validation: Server TypeScript build passed. All 350 tests across 17 server suites passed, including real bcrypt comparison, fresh-session creation, overlong/wrong credentials, injection/delegation, and infrastructure failures. LoginLambda bundled successfully using esbuild for Node 24 to a temporary /tmp file. SAM template lint validation and `git diff --check` passed. Local checks verified eight login regex-selection cases (empty, validation, unauthorized, unexpected, multiline, and similar-prefix errors), nonoverlapping 400/401/500 matches, and 401 response/CORS declarations. SAM reported its existing sandbox warning writing global metadata outside the workspace, while validation exited successfully.
- Scope: Login persistence and local configuration only. Logout, other protected operations, their 401 mappings, remaining DAO implementations, and live authentication integration-test migration remain pending. Old live login/registration tests still target Milestone 3 expectations. No AWS requests, live HTTP verification, deployment, Git commit, or push performed.
- Sources: Official bcryptjs comparison/truncation documentation: https://github.com/dcodeIO/bcrypt.js ; official API Gateway Lambda error mappings: https://docs.aws.amazon.com/apigateway/latest/developerguide/handle-errors-in-lambda-integration.html
- Review: Login now implemented in UserService.ts. Same way as the register function in the previous attribution commit.

## 2026-11-22: Persistent logout and session revocation
- Tool: OpenAI Codex
- Task: Replace simulated logout with authenticated session revocation, connect its Lambda to the existing composition, and prepare permissions/error handling as the next milestone feature increment.
- Changes: Updated `tweeter-server/src/model/service/UserService.ts` to accept revocation through its authorization interface and delegate logout to AuthorizationService. Updated `tweeter-server/src/lambda/user/LogoutLambda.ts` with an injectable handler class using cached AWS composition after request validation. Updated LogoutFunction in `template.yaml` with GetItem/UpdateItem/DeleteItem permissions only on SessionsTable, accurate API documentation, explicit 401/CORS responses, and a nonoverlapping 500 selection pattern. Added `tweeter-web/test/server/LogoutService.test.ts` with 12 tests using real AuthorizationService and a stateful session DAO double, including post-logout rejection, same-user/other-user session isolation, expired/unknown tokens, repeated logout, and storage failures. Updated `LogoutLambda.test.ts` with composition/injection, authorization-error propagation, and validation-before-composition checks. Updated `README.md` and this log. Changed/new TypeScript files retain attribution comments.
- Validation: Server TypeScript build passed. All 364 tests across 18 server suites passed. LogoutLambda bundled successfully using esbuild for Node 24 to a temporary /tmp file. SAM lint validation and `git diff --check` passed. Local regex checks covered eight logout error-selection cases, nonoverlapping 400/401/500 matches, and 401 response/CORS declarations. SAM validation exited successfully with its existing sandbox metadata-write warning.
- Scope: Logout now revokes sessions in source. Remaining protected endpoints still need authentication wiring and persisted data. Old live authentication tests require real-session fixtures before deployment. Tests used mocked/in-memory DAOs; no AWS requests, live HTTP/CORS verification, deployment, Git commit, or push performed.
- Sources: Official API Gateway Lambda error mapping reference: https://docs.aws.amazon.com/apigateway/latest/developerguide/handle-errors-in-lambda-integration.html
- Review: Logout and session revoking implemented. `UserService.logout()` calls `revokeSession()`. that checks to see if the user is currently authorized under TTL and then deletes the session. 

## 2026-11-22: Authenticated persisted user lookup
- Tool: OpenAI Codex
- Task: Replace FakeData user lookup with session authorization and persisted profile retrieval as the next separate milestone feature increment.
- Changes: Updated `tweeter-server/src/model/service/UserService.ts` to authorize/refresh the caller's session before invoking UserDAO.getUser, reconstruct only the public profile, and preserve null for a missing alias. Removed its final FakeData import and expanded the injected authorization interface. Updated `tweeter-server/src/lambda/user/GetUserLambda.ts` to resolve cached AWS composition after validation and support injected test services. Updated GetUserFunction in `template.yaml` with GetItem permission on UsersTable, GetItem/UpdateItem on SessionsTable, accurate endpoint documentation, 401/CORS responses, and a nonoverlapping 500 pattern. Added `tweeter-web/test/server/GetUserService.test.ts` with 14 tests and updated `GetUserLambda.test.ts` for injected persisted-service behavior, null responses, authorization failures, and validation-before-composition. Updated `README.md` and this log. New/modified TypeScript files retain attribution comments.
- Validation: Server TypeScript build passed. All 379 tests across 19 server suites passed, including refresh beyond the previous expiry, expired records awaiting TTL cleanup, profile lookup after logout, and session/profile infrastructure errors. GetUserLambda bundled successfully using esbuild for Node 24 to a temporary /tmp file. SAM lint validation and `git diff --check` passed. Local regex checks verified eight user-lookup error-selection cases, nonoverlapping 400/401/500 matches, and 401/CORS declarations. SAM validation exited successfully with its existing sandbox global metadata-write warning.
- Scope: UserService's four operations now use the persistence/authentication layer in source. Follow/status services still require migration and protected-operation authorization. Old live user-lookup/authentication tests still require real-session fixtures. Tests use mocked/stateful in-memory DAOs; no AWS requests, live HTTP/CORS verification, deployment, Git commit, or push performed.
- Sources: Existing design and API Gateway Lambda error mapping reference used for the authentication increments: https://docs.aws.amazon.com/apigateway/latest/developerguide/handle-errors-in-lambda-integration.html
- Review: getUser implemented through UserService.ts. Simply looks through the database and checks to see if the user exists or not. All tests passing.

## 2026-11-22: DynamoDB follow DAO
- Tool: OpenAI Codex
- Task: Implement the complete follow DAO storage contract as a separate increment while avoiding duplicated mutation and pagination code. Keep the student's requested broader duplication review pending before milestone completion.
- Changes: Added `tweeter-server/src/model/dao/dynamodb/DynamoDBFollowDAO.ts` with atomic three-item relationship/count transactions, conditional idempotent follow/unfollow behavior, user existence/count checks, negative/overflow protection, self-follow rejection, consistent following-status/count lookups, and reverse-index follower queries. Follow/unfollow share one mutation helper and counter-update builder; followers/followees share one query helper with alias cursors, one-item lookahead, and internal DynamoDB pagination. Cancellation reasons distinguish confirmed duplicate operations from counter/infrastructure failures. Added `tweeter-web/test/server/DynamoDBFollowDAO.test.ts` with 41 isolated tests. Both files include attribution comments. Updated `README.md` and this log.
- Validation: Server TypeScript build passed. All 420 tests across 20 server suites passed. `git diff --check` passed. Tests cover transaction command structure, idempotent repeats, missing users, counter/error handling, both list directions with 13 aliases, lookahead retention, exact final pages, internal response boundaries, and input/configuration failures. Tests mock AWS responses; they do not verify live DynamoDB transaction atomicity or index propagation.
- Scope: Storage implementation only. AWS factory/configuration, FollowService/Lambda wiring, authentication, permissions, and live tests remain for the next relationship increments. No AWS requests, deployment, Git commit, or push performed. Broader duplication review remains pending before final passoff.
- Sources: Official AWS transaction and query references: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html and https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html . Verified SDK v3 cancellation-reason availability against the AWS SDK maintainer clarification and local SDK implementation: https://github.com/aws/aws-sdk-js-v3/issues/3635 .
- Review: DynamoDBFolowerDAO.ts implemented. Relationships can be changed by following/unfollowing. Getting follower/followee counts is also possible with real data.

## 2026-11-23: Authenticated persistent follow and unfollow
- Tool: OpenAI Codex
- Task: Connect follow/unfollow mutations to the DAO and authentication layer as the next increment, deriving the acting user from the session and sharing mutation/composition code to limit duplication.
- Changes: Updated `tweeter-server/src/model/service/FollowService.ts` with injected follow factory/authorization and a shared mutation helper. Updated `config/AWSConfig.ts` and `model/dao/aws/AWSDAOFactory.ts` with required FOLLOWS_TABLE_NAME configuration and a cached FollowDAO instance. Added shared `lambda/config/getAWSDependencies.ts`, refactored `getUserService.ts` to reuse it, and added `getFollowService.ts`. Added `lambda/follow/FollowActionLambda.ts` so FollowLambda/UnfollowLambda share service resolution/delegation through the existing UserActionLambda validation template. Updated `template.yaml` with the table environment variable, scoped underlying transaction/session permissions, endpoint descriptions, and both routes' nonoverlapping 400/401/500 responses with CORS. Added `tweeter-web/test/server/FollowServiceActions.test.ts` (20 tests) and `AWSComposition.test.ts` (one shared-composition test); expanded `FollowLambda.test.ts` and `AWSDAOFactory.test.ts`. Updated `README.md` and this log. New/modified TypeScript files retain attribution comments.
- Validation: Server TypeScript build passed. All 447 tests across 22 server suites passed. Follow/Unfollow Lambdas bundled successfully with esbuild for Node 24 to temporary /tmp files. SAM lint validation and `git diff --check` passed. Each route passed eight local error-selection checks plus 401/CORS declaration checks. Tests cover acting-user derivation, authorization before mutation, waiting for transaction completion, self-follow rejection, idempotent delegation, error propagation, factory configuration, and shared dependencies. SAM exited successfully with its existing sandbox metadata-write warning.
- Scope: Follow/unfollow mutations now persist in source. Relationship count/list/status service methods still use FakeData and await migration. Feed backfill/removal is not introduced; future post delivery remains pending. Live authentication/mutation tests still need real-session fixtures. No AWS requests, deployment, Git commit, or push performed. Broader duplication review remains on the milestone checklist.
- Sources: Official AWS transaction IAM reference (permissions are the underlying PutItem/UpdateItem/DeleteItem/GetItem actions): https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis-iam.html
- Review: FollowService implements following with real data. It changes the relationship in the database and creats the follow DAO.

## 2026-11-23: Persisted follower/followee counts and following status
- Tool: OpenAI Codex
- Task: Connect the two relationship count endpoints and following-status endpoint to authenticated DAO reads as the next milestone increment, sharing authorization/count handling to avoid duplication.
- Changes: Updated `tweeter-server/src/model/service/FollowService.ts` to load persisted counts through one selection helper and delegate following status to FollowDAO.isFollowing. Extracted a generic authorization/DAO-access helper shared by reads and mutations. Added `lambda/follow/FollowCountLambda.ts` to share count service resolution/delegation and updated GetFollowerCountLambda/GetFolloweeCountLambda to select their operations. Updated GetFollowingStatusLambda with injectable service composition. Updated `template.yaml` with scoped read/session-refresh IAM permissions, accurate API descriptions, 401/CORS responses, and nonoverlapping error patterns for the three routes. Added `tweeter-web/test/server/FollowServiceReads.test.ts` (23 tests) and updated FollowCountLambdas/FollowingStatusLambda tests to replace FakeData assumptions with delegation/injection and authorization checks. Updated `README.md` and this log. New/modified TypeScript files retain attribution comments.
- Validation: Server TypeScript build passed. All 473 tests across 23 server suites passed, including all existing mutation tests after shared-helper extraction. The three Lambdas bundled successfully with esbuild for Node 24 to temporary /tmp files. SAM lint validation and `git diff --check` passed. Each route passed eight local error-selection cases and 401/CORS declaration checks. Tests cover correct counter selection, zero values, status direction/booleans, authorization before reads, missing-user errors, and infrastructure failures. SAM validation exited successfully with its existing sandbox metadata-write warning.
- Scope: Counts and following status now use persisted data in source. Only list methods still use FakeData in FollowService; status posting/story/feed also remain to migrate. Existing live count/status tests require real sessions and persisted fixtures. No AWS requests, live HTTP/CORS verification, deployment, Git commit, or push performed. Broader duplication review remains pending before milestone completion.
- Sources: Existing DAO contracts/implementations and the API Gateway error mapping pattern established in prior increments: https://docs.aws.amazon.com/apigateway/latest/developerguide/handle-errors-in-lambda-integration.html
- Review: Pending student review.
