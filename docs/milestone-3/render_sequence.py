"""Render the source-traced sequence as PDF, SVG, and editable PlantUML.

Run from any directory with Python 3 and matplotlib installed.
AI-assisted: see ../../AI-ATTRIBUTION.md.
"""
from pathlib import Path
import os
import tempfile

os.environ.setdefault("MPLCONFIGDIR", str(Path(tempfile.gettempdir()) / "tweeter-mpl"))
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyArrowPatch

OUT = Path(__file__).resolve().parent
PARTICIPANTS = [
    ("component", "postStatus", "PostStatus component"),
    ("presenter", "presenter", "PostPresenter"),
    ("listener", "listener", "PostView (component)"),
    ("client", "clientService", "StatusService (client)"),
    ("facade", "facade", "ServerFacade"),
    ("communicator", "communicator", "ClientCommunicator"),
    ("gateway", "gateway", "AWS API Gateway"),
    ("lambda", "postStatusLambda", "PostStatusLambda module"),
    ("server", "serverService", "StatusService (server)"),
]
# A dashed arrow means an eventual response / promise completion.
# The HTTP request is asynchronous; the JS callers suspend at await.
MESSAGES = [
    (None, "component", "submitPost(event)", "call"),
    ("component", "presenter", "submitPost(post,\ncurrentUser, authToken)", "call"),
    ("presenter", "listener", "setIsLoading(true)", "call"),
    ("presenter", "listener", 'displayInfoMessage(\n"Posting status...", 0)', "call"),
    ("presenter", "presenter", "new Status(post, currentUser,\nDate.now())", "call"),
    ("presenter", "presenter", "post(authToken, status)", "call"),
    ("presenter", "client", "postStatus(authToken, status)", "call"),
    ("client", "client", "new PostStatusRequest(\nauthToken.token, status.dto)", "call"),
    ("client", "facade", "postStatus(request)", "call"),
    ("facade", "facade", "performAction(request,\n\"/status/post\", failureMessage)", "call"),
    ("facade", "communicator", "doPost(request,\n\"/status/post\")", "call"),
    ("communicator", "communicator", "JSON.stringify(request)", "call"),
    ("communicator", "gateway", "fetch: POST /dev/status/post\nJSON {token, status}", "async"),
    ("gateway", "lambda", "handler(request)\nJSON body mapped to event", "call"),
    ("lambda", "lambda", "validatePostStatusRequest(request)\nvalid token shape + nonblank post", "call"),
    ("lambda", "lambda", "Status.fromDto(request.status)", "call"),
    ("lambda", "server", "postStatus(request.token, status)", "call"),
    ("server", "server", "await new Promise(\nsetTimeout(resolve, 2000))", "call"),
    ("server", "lambda", "Promise<void> completes", "return"),
    ("lambda", "gateway", "new TweeterResponse(true)\n{success: true, message: null}", "return"),
    ("gateway", "communicator", "HTTP 200 + JSON body\nintegration response mapping", "return"),
    ("communicator", "communicator", "await response.json()\ncheck HTTP + common fields", "call"),
    ("communicator", "facade", "TweeterResponse", "return"),
    ("facade", "facade", "check response.success", "call"),
    ("facade", "client", "Promise<void> completes", "return"),
    ("client", "presenter", "await post(...) completes", "return"),
    ("presenter", "listener", 'setPost("")', "call"),
    ("presenter", "listener", 'displayInfoMessage(\n"Status posted!", 2000)', "call"),
]


def render():
    plt.rcParams.update({"font.family": "DejaVu Sans", "svg.fonttype": "none",
                         "svg.hashsalt": "tweeter-milestone-3", "pdf.fonttype": 42})
    fig, ax = plt.subplots(figsize=(28, 21))
    fig.subplots_adjust(left=0, right=1, top=1, bottom=0)
    ax.set(xlim=(0, 2350), ylim=(1740, 0))
    ax.axis("off")
    ink, blue = "#172d44", "#17688b"
    ax.text(55, 65, "Successful status submission", fontsize=26, weight="bold", color=ink)
    ax.text(55, 103, "Tweeter · Milestone 3 · UML sequence diagram · traced from the current implementation", fontsize=13, color=ink)
    ax.text(55, 137, "Solid: invocation    Open arrow: asynchronous HTTP request    Dashed: eventual response / promise completion", fontsize=11, color=ink)
    ax.add_patch(Rectangle((45, 170), 1445, 1335, color="#eff6fb", zorder=-3))
    ax.add_patch(Rectangle((1510, 170), 795, 1335, color="#f1f8f3", zorder=-3))
    ax.text(60, 196, "BROWSER / CLIENT", fontsize=11, weight="bold", color=blue)
    ax.text(1525, 196, "AWS / SERVER", fontsize=11, weight="bold", color="#316b48")
    xs = {p[0]: 125 + i * 260 for i, p in enumerate(PARTICIPANTS)}
    for key, name, kind in PARTICIPANTS:
        x = xs[key]
        ax.add_patch(Rectangle((x - 109, 215), 218, 65, facecolor="white", edgecolor=ink, lw=1.2))
        ax.text(x, 238, name, ha="center", va="center", fontsize=11, weight="bold", color=ink)
        ax.text(x, 262, ": " + kind, ha="center", va="center", fontsize=9, color=ink)
        ax.plot([x, x], [280, 1480], color="#90a4b3", ls=(0, (4, 4)), lw=0.9, zorder=-1)
    y0, step = 320, 41
    # Activation rectangles include suspended await intervals. JS is not blocked.
    for key, first, last in [("component", 0, 27), ("presenter", 1, 27), ("client", 6, 25),
                             ("facade", 8, 24), ("communicator", 10, 22), ("gateway", 12, 20),
                             ("lambda", 13, 19), ("server", 16, 18)]:
        ax.add_patch(Rectangle((xs[key]-5, y0+first*step), 10, (last-first)*step+5,
                               facecolor="#dae8f2", edgecolor=blue, lw=0.75, zorder=0))
    for i, (source, target, label, kind) in enumerate(MESSAGES):
        y = y0 + i * step
        a = xs[source] if source else 20
        b = xs[target]
        style = (0, (4, 3)) if kind == "return" else "solid"
        arrow = "->" if kind in ("async", "return") else "-|>"
        if source == target:
            # Draw a UML self call; its label occupies the space to its right.
            ax.plot([a+5, a+42, a+42], [y-5, y-5, y+10], color=ink, lw=1)
            ax.add_patch(FancyArrowPatch((a+42, y+10), (a+5, y+10), arrowstyle=arrow, mutation_scale=11, color=ink, lw=1))
            label_x = a-12 if source == "server" else a+12
            align = "right" if source == "server" else "left"
            ax.text(label_x, y-11, f"{i+1}. {label}", ha=align, va="bottom", fontsize=8.2, color=ink,
                    bbox=dict(facecolor="white", edgecolor="none", pad=1.2, alpha=.94))
        else:
            ax.add_patch(FancyArrowPatch((a, y), (b, y), arrowstyle=arrow,
                          mutation_scale=12, color=ink, lw=1.05, linestyle=style))
            ax.text((a+b)/2, y-5, f"{i+1}. {label}", ha="center", va="bottom", fontsize=8.5, color=ink,
                    bbox=dict(facecolor="white", edgecolor="none", pad=1.2, alpha=.96))
    notes = [
        "Async behavior: async methods immediately return promises. Callers resume after their awaited operation completes; the browser event loop remains available.",
        "Gateway bridge: custom (non-proxy) Lambda integration passes the JSON body as the handler event and maps the returned object into an HTTP JSON response.",
        "Milestone 3 server behavior: simulates posting for two seconds; no database write or follower-feed update occurs. The status author is reconstructed from its DTO.",
        "Requested endpoint: this diagram stops at the success displayInfoMessage() call. The existing finally block then deletes the posting toast and calls setIsLoading(false).",
        "The listener is the PostView object created by PostStatus. Validation is a helper function; PostStatusLambda is a module exporting handler(), rather than a class instance.",
    ]
    for i, note in enumerate(notes):
        ax.text(55, 1540+i*31, note, fontsize=10, color=ink)
    for suffix in ("pdf", "svg"):
        metadata = {"CreationDate": None, "ModDate": None} if suffix == "pdf" else {"Date": None}
        fig.savefig(OUT / f"post-status-sequence.{suffix}", facecolor="white", metadata=metadata)
    plt.close(fig)

    lines = ["@startuml", "title Successful status submission — Tweeter Milestone 3", "hide footbox", "autonumber"]
    for key, name, kind in PARTICIPANTS:
        lines.append(f'participant "{name}\\n: {kind}" as {key}')
    lines.append("note over component,communicator: Client async methods return promises; await suspends the caller while the event loop remains available.")
    for source, target, label, kind in MESSAGES:
        escaped = label.replace("\n", "\\n")
        arrow = "-->" if kind == "return" else ("->>" if kind == "async" else "->")
        lines.append(f'{source} {arrow} {target}: {escaped}' if source else f'[-> {target}: {escaped}')
    lines.extend([
        "note over gateway,server: Custom non-proxy integration bridges HTTP JSON and the Lambda event/response.\\nServer posting is simulated; no persistence or feed updates.",
        "note over presenter,listener: After the displayed endpoint, finally deletes the posting toast and calls setIsLoading(false).",
        "@enduml",
    ])
    (OUT / "post-status-sequence.puml").write_text("\n".join(lines) + "\n")


if __name__ == "__main__":
    render()
