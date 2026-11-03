import {anything, capture, instance, mock, spy, verify, when} from "@typestrong/ts-mockito";
import {PostPresenter, PostView} from "../../src/model.presenter/PostPresenter";
import {StatusService} from "../../src/model.service/StatusService";
import {AuthToken, Status, User} from "tweeter-shared";


describe("PostPresenter", () => {
    let mockPostPresenterView: PostView;
    let postPresenter: PostPresenter;
    let mockService: StatusService;

    const authToken = new AuthToken("abc123", Date.now());
    const user = new User("first", "last", "alias", "url");
    const status = new Status("post", user, Date.now());

    beforeEach(() => {
        mockPostPresenterView = mock<PostView>();
        const mockPostPresenterViewInstance = instance(mockPostPresenterView);
        when(mockPostPresenterView.displayInfoMessage(anything(), 0)).thenReturn("messageId123");

        const postPresenterSpy = spy(new PostPresenter(mockPostPresenterViewInstance));
        postPresenter = instance(postPresenterSpy);

        mockService = mock<StatusService>();
        when(postPresenterSpy.service).thenReturn(instance(mockService));
    })

    it("tells the view to display a posting status message", async () => {
        await postPresenter.submitPost("post", user, authToken);
        verify(mockPostPresenterView.displayInfoMessage("Posting status...", 0)).once();
    })

    it("calls postStatus on the post status service with the correct status string and auth token.", async () => {
        await postPresenter.submitPost("post", user, authToken);
        verify(mockService.postStatus(authToken, anything())).once();

        let [,capturedStatus] = capture(mockService.postStatus).last();
        expect(capturedStatus.post).toBe(status.post);
        expect(capturedStatus.user).toBe(status.user);
    })

    it("tells the view to clear the info message that was displayed previously, clear the post, and display a status posted message when successful", async () => {
        await postPresenter.submitPost("post", user, authToken);

        verify(mockPostPresenterView.deleteMessage("messageId123")).once();
        verify(mockPostPresenterView.setPost("")).once()
        verify(mockPostPresenterView.displayInfoMessage("Status posted!", 2000)).once()
        verify(mockPostPresenterView.displayErrorMessage(anything())).never();
    })

    it("tells the view to clear the info message and display an error message but does not tell it to clear the post or display a status posted message when unsuccessful", async () => {
        let error = new Error("Error occurred.");
        when(mockService.postStatus(anything(), anything())).thenThrow(error);

        await postPresenter.submitPost("post", user, authToken);
        verify(mockPostPresenterView.displayErrorMessage("Failed to post the status because of exception: Error: Error occurred.")).once();
        verify(mockPostPresenterView.setPost(anything())).never();
        verify(mockPostPresenterView.displayInfoMessage(anything(), anything())).once();

    })
})