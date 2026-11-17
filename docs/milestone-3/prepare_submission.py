"""Package the current versionable files, including uncommitted edits.

Python 3 + PyYAML are needed to extract the local reference specification.
This does not authenticate with AWS, publish documentation, or deploy resources.
AI-assisted: see ../../AI-ATTRIBUTION.md.
"""
import json
import re
from pathlib import Path
import subprocess
import zipfile
import yaml

ROOT = Path(__file__).resolve().parents[2]
DOCS = Path(__file__).resolve().parent
UNEXPECTED_ERROR_PATTERN = r"(?s)^(?!\[Bad Request\]).+"
BAD_REQUEST_PATTERN = r"(?s)^\[Bad Request\].*"


class TemplateLoader(yaml.SafeLoader):
    pass


# Preserve CloudFormation substitution expressions as strings in the local reference.
TemplateLoader.add_multi_constructor("!", lambda loader, tag, node: loader.construct_scalar(node))


def validate_responses(integration):
    responses = integration["responses"]
    assert responses["default"]["statusCode"] == "200"
    assert responses[BAD_REQUEST_PATTERN]["statusCode"] == "400"
    assert responses[UNEXPECTED_ERROR_PATTERN]["statusCode"] == "500"
    assert responses[UNEXPECTED_ERROR_PATTERN]["responseParameters"]["method.response.header.Access-Control-Allow-Origin"] == "'*'"
    for message, expected in [("", "200"), ("[Bad Request] Missing token", "400"),
                              ("[Bad Request]\nMissing token", "400"),
                              ("Unexpected failure", "500"), ("Unexpected\nfailure", "500")]:
        matches = [r["statusCode"] for pattern, r in responses.items()
                   if pattern != "default" and re.fullmatch(pattern, message)]
        assert len(matches) <= 1, (message, matches)
        assert (matches[0] if matches else "200") == expected, (message, matches)


def prepare():
    template = yaml.load((ROOT / "template.yaml").read_text(), Loader=TemplateLoader)
    spec = template["Resources"]["TweeterApi"]["Properties"]["DefinitionBody"]
    spec["info"]["description"] = (
        "LOCAL REFERENCE extracted from template.yaml; NOT an API Gateway stage export. "
        "Integration URIs retain CloudFormation substitution expressions. "
        "Submit swagger.aws.json exported from the documented AWS stage instead."
    )
    operations = list(spec["paths"].values())
    assert len(operations) == 14
    for methods in operations:
        post = methods["post"]
        assert post["description"].strip()
        assert {"200", "400", "500"} <= set(post["responses"])
        integration = post["x-amazon-apigateway-integration"]
        assert integration["type"] == "aws"
        validate_responses(integration)
        assert "$context.responseOverride.status = 500" in integration["responses"]["default"]["responseTemplates"]["application/json"]
    (DOCS / "swagger.local-reference.json").write_text(json.dumps(spec, indent=2) + "\n")

    aws_export = DOCS / "swagger.aws.json"
    if aws_export.exists():
        deployed = json.loads(aws_export.read_text())
        assert deployed["swagger"] == "2.0"
        assert deployed["host"] == "s58iqa332m.execute-api.us-east-1.amazonaws.com"
        assert deployed["basePath"] == "/dev"
        assert set(deployed["paths"]) == set(spec["paths"])
        for path, methods in deployed["paths"].items():
            for verb in ("post", "options"):
                method = methods[verb]
                assert method.get("description", "").strip(), (verb, path)
                assert "x-amazon-apigateway-integration" in method, (verb, path)
            assert {"200", "400", "500"} <= set(methods["post"]["responses"])
            validate_responses(methods["post"]["x-amazon-apigateway-integration"])
        print("Validated AWS export: 14 POST + 14 OPTIONS descriptions; explicit 200/400/500 POST integration responses.")

    # Git selects files; disk supplies their current contents. No git add/commit is needed.
    result = subprocess.run(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
        cwd=ROOT, check=True, capture_output=True,
    )
    files = sorted(set(result.stdout.decode().strip("\0").split("\0")))
    output = ROOT / "submission" / "milestone-3-project.zip"
    output.parent.mkdir(exist_ok=True)
    included = []
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name in files:
            path = ROOT / name
            if not path.is_file() or name.startswith("submission/"):
                continue
            if any(part in {"node_modules", ".git", ".aws-sam", "dist", "build", "__pycache__"} for part in path.relative_to(ROOT).parts):
                continue
            archive.write(path, arcname="tweeter-web-starter/" + name)
            included.append(name)
    with zipfile.ZipFile(output) as archive:
        assert archive.testzip() is None
        assert "tweeter-web-starter/docs/milestone-3/post-status-sequence.pdf" in archive.namelist()
        assert "tweeter-web-starter/AI-ATTRIBUTION.md" in archive.namelist()
    print(f"Validated {len(operations)} documented POST operations (source template).")
    print("Explicit 500 responses match only nonempty unexpected errors; selection cases validated.")
    print(f"Packaged {len(included)} current files: {output} ({output.stat().st_size:,} bytes)")
    if not (DOCS / "swagger.aws.json").exists():
        print("PENDING: real stage export docs/milestone-3/swagger.aws.json")


if __name__ == "__main__":
    prepare()
