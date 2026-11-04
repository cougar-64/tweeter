.PHONY: build-GetFollowersFunction build-GetFolloweesFunction

# SAM supplies ARTIFACTS_DIR and expects this target to match the template's logical ID.
build-GetFollowersFunction:
	npm run compile --workspace tweeter-shared
	npm run build --workspace tweeter-server
	./node_modules/.bin/esbuild tweeter-server/dist/lambda/follow/GetFollowersLambda.js --bundle --platform=node --target=node24 --format=cjs --outfile="$(ARTIFACTS_DIR)/GetFollowersLambda.js"

build-GetFolloweesFunction:
	npm run compile --workspace tweeter-shared
	npm run build --workspace tweeter-server
	./node_modules/.bin/esbuild tweeter-server/dist/lambda/follow/GetFolloweesLambda.js --bundle --platform=node --target=node24 --format=cjs --outfile="$(ARTIFACTS_DIR)/GetFolloweesLambda.js"
