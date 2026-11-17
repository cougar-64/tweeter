# Milestone 3 submission documents

The PDF follows the current code from `PostStatus.submitPost(event)` through
the presenter, client service, facade, communicator, API Gateway, Lambda, and
server service, ending at the component listener's success
`displayInfoMessage("Status posted!", 2000)` call. It shows eventual responses
and explains `await`. The existing `finally` cleanup occurs after the requested
end of the diagram and is described in a note.

## Files to submit to Canvas

| Deliverable | File | Status |
| --- | --- | --- |
| Current project ZIP | `submission/milestone-3-project.zip` at the repository root | Generated from current versionable files, including uncommitted edits |
| Exported Swagger with AWS extensions | `docs/milestone-3/swagger.aws.json` | Exported from `dev` with published method descriptions and integration extensions |
| UML sequence diagram PDF | `docs/milestone-3/post-status-sequence.pdf` | Generated from the current client/server flow |
| AI attribution log | `AI-ATTRIBUTION.md` at the repository root | Existing log extended for this documentation task; student review pending |

`swagger.local-reference.json` is extracted from the SAM template for review.
It is **not an AWS stage export** and must not be substituted for the required
export. Its integration URIs retain CloudFormation substitution expressions.
The editable diagram sources are `post-status-sequence.puml` and
`render_sequence.py`; `post-status-sequence.svg` is a vector preview.

## Published AWS export

The API is `s58iqa332m`, stage `dev`, region `us-east-1`. On 2026-11-17,
documentation version `m3-docs-20261117` was published to this stage after
adding descriptions to the 14 generated OPTIONS methods. Existing POST
descriptions were retained. The stage was then exported with AWS integration
extensions to `swagger.aws.json`.

Verification confirmed all 14 POST and 14 OPTIONS descriptions and integration
extensions in the actual export. Every POST declares 200, 400, and 500 method
responses. The stage now uses runtime deployment `iv9v59`, which adds explicit
HTTP 500 integration responses to all fourteen POST methods. The published
documentation version remains `m3-docs-20261117`; all method descriptions were
retained in the refreshed export.

To refresh this export after future changes:

1. Authenticate with `aws login` if needed, then publish any revised API
   documentation to `dev` using a new version.
2. From the repository root, run:

   ```sh
   aws apigateway get-export --rest-api-id s58iqa332m --stage-name dev --export-type swagger --parameters extensions=integrations --accepts application/json --region us-east-1 docs/milestone-3/swagger.aws.json
   ```

3. Inspect the exported file for all 14 POST paths, method descriptions,
   `200` / `400` / `500` method responses, and integration extensions.
   Also inspect generated OPTIONS methods for descriptions, since the assignment
   asks for a description on each method.
4. Verify each POST integration defines explicit 200, 400, and 500 responses.
   Re-export after any deployed change.
5. Run `python3 docs/milestone-3/prepare_submission.py` again so the ZIP includes
   the final exported file and any final edits.

## Rubric review

- All 14 application POST methods have a description and declare HTTP 200,
  400, and 500 method responses.
- Followers, followees, story, and feed support page size, last-item cursors,
  and a `hasMore` response.
- Login rejects an empty alias through server-side validation. Posting rejects
  blank text. Validation errors begin with `[Bad Request]` and map to HTTP 400.
- Every POST integration defines separate 200, 400, and 500 responses in both
  the source template and the deployed export. The 500 selection pattern
  `(?s)^(?!\[Bad Request\]).+` matches nonempty unexpected errors, including
  multiline messages. It excludes the validation prefix and does not match an
  empty message, preserving default success handling. The response returns
  a generic error message with CORS. The existing default-template status
  override remains as a fallback.
- Posting currently simulates a two-second operation without persistence or
  follower-feed updates; the diagram reflects that implementation.

The exported method descriptions, method responses, integration mappings, and
stage documentation version were checked against AWS on 2026-11-17. The SAM
template passed lint validation, and local selection-rule checks cover empty,
validation, unexpected, and multiline messages. A server failure was not
deliberately injected into the deployed Lambdas.

After deployment, all 80 live integration tests across 15 suites passed,
covering successful calls, validation errors, pagination, and CORS:

```sh
npm run test:integration --workspace tweeter-web -- --runInBand
```

## Rebuild the artifacts

```sh
python3 docs/milestone-3/render_sequence.py
python3 docs/milestone-3/prepare_submission.py
```

The renderer uses matplotlib; the packager uses PyYAML. Both were available in
the local Python environment when these files were generated. The packager
uses Git's tracked and unignored file list and reads current disk contents;
it excludes build output, dependencies, Git metadata, and its own output ZIP.
