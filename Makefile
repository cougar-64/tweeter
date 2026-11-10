.PHONY: build-GetFollowersFunction build-GetFolloweesFunction build-GetFollowerCountFunction build-GetFolloweeCountFunction build-GetFollowingStatusFunction build-FollowFunction build-UnfollowFunction build-GetUserFunction build-LoginFunction build-RegisterFunction build-LogoutFunction build-GetStoryFunction build-GetFeedFunction build-PostStatusFunction

# SAM supplies ARTIFACTS_DIR and expects this target to match the template's logical ID.
build-GetFollowersFunction:
	npm run compile --workspace tweeter-shared
	npm run build --workspace tweeter-server
	./node_modules/.bin/esbuild tweeter-server/dist/lambda/follow/GetFollowersLambda.js --bundle --platform=node --target=node24 --format=cjs --outfile="$(ARTIFACTS_DIR)/GetFollowersLambda.js"

build-GetFolloweesFunction:
	npm run compile --workspace tweeter-shared
	npm run build --workspace tweeter-server
	./node_modules/.bin/esbuild tweeter-server/dist/lambda/follow/GetFolloweesLambda.js --bundle --platform=node --target=node24 --format=cjs --outfile="$(ARTIFACTS_DIR)/GetFolloweesLambda.js"

build-GetFollowerCountFunction:
	npm run compile --workspace tweeter-shared
	npm run build --workspace tweeter-server
	./node_modules/.bin/esbuild tweeter-server/dist/lambda/follow/GetFollowerCountLambda.js --bundle --platform=node --target=node24 --format=cjs --outfile="$(ARTIFACTS_DIR)/GetFollowerCountLambda.js"

build-GetFolloweeCountFunction:
	npm run compile --workspace tweeter-shared
	npm run build --workspace tweeter-server
	./node_modules/.bin/esbuild tweeter-server/dist/lambda/follow/GetFolloweeCountLambda.js --bundle --platform=node --target=node24 --format=cjs --outfile="$(ARTIFACTS_DIR)/GetFolloweeCountLambda.js"

build-GetFollowingStatusFunction:
	npm run compile --workspace tweeter-shared
	npm run build --workspace tweeter-server
	./node_modules/.bin/esbuild tweeter-server/dist/lambda/follow/GetFollowingStatusLambda.js --bundle --platform=node --target=node24 --format=cjs --outfile="$(ARTIFACTS_DIR)/GetFollowingStatusLambda.js"

build-FollowFunction:
	npm run compile --workspace tweeter-shared
	npm run build --workspace tweeter-server
	./node_modules/.bin/esbuild tweeter-server/dist/lambda/follow/FollowLambda.js --bundle --platform=node --target=node24 --format=cjs --outfile="$(ARTIFACTS_DIR)/FollowLambda.js"

build-UnfollowFunction:
	npm run compile --workspace tweeter-shared
	npm run build --workspace tweeter-server
	./node_modules/.bin/esbuild tweeter-server/dist/lambda/follow/UnfollowLambda.js --bundle --platform=node --target=node24 --format=cjs --outfile="$(ARTIFACTS_DIR)/UnfollowLambda.js"

build-GetUserFunction:
	npm run compile --workspace tweeter-shared
	npm run build --workspace tweeter-server
	./node_modules/.bin/esbuild tweeter-server/dist/lambda/user/GetUserLambda.js --bundle --platform=node --target=node24 --format=cjs --outfile="$(ARTIFACTS_DIR)/GetUserLambda.js"

build-LoginFunction:
	npm run compile --workspace tweeter-shared
	npm run build --workspace tweeter-server
	./node_modules/.bin/esbuild tweeter-server/dist/lambda/user/LoginLambda.js --bundle --platform=node --target=node24 --format=cjs --outfile="$(ARTIFACTS_DIR)/LoginLambda.js"

build-RegisterFunction:
	npm run compile --workspace tweeter-shared
	npm run build --workspace tweeter-server
	./node_modules/.bin/esbuild tweeter-server/dist/lambda/user/RegisterLambda.js --bundle --platform=node --target=node24 --format=cjs --outfile="$(ARTIFACTS_DIR)/RegisterLambda.js"

build-LogoutFunction:
	npm run compile --workspace tweeter-shared
	npm run build --workspace tweeter-server
	./node_modules/.bin/esbuild tweeter-server/dist/lambda/user/LogoutLambda.js --bundle --platform=node --target=node24 --format=cjs --outfile="$(ARTIFACTS_DIR)/LogoutLambda.js"

build-GetStoryFunction:
	npm run compile --workspace tweeter-shared
	npm run build --workspace tweeter-server
	./node_modules/.bin/esbuild tweeter-server/dist/lambda/status/GetStoryLambda.js --bundle --platform=node --target=node24 --format=cjs --outfile="$(ARTIFACTS_DIR)/GetStoryLambda.js"

build-GetFeedFunction:
	npm run compile --workspace tweeter-shared
	npm run build --workspace tweeter-server
	./node_modules/.bin/esbuild tweeter-server/dist/lambda/status/GetFeedLambda.js --bundle --platform=node --target=node24 --format=cjs --outfile="$(ARTIFACTS_DIR)/GetFeedLambda.js"

build-PostStatusFunction:
	npm run compile --workspace tweeter-shared
	npm run build --workspace tweeter-server
	./node_modules/.bin/esbuild tweeter-server/dist/lambda/status/PostStatusLambda.js --bundle --platform=node --target=node24 --format=cjs --outfile="$(ARTIFACTS_DIR)/PostStatusLambda.js"
