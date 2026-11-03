import PostStatus from "../../src/components/postStatus/PostStatus"
import {render, screen} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {userEvent} from "@testing-library/user-event/dist/cjs/setup/index.js";
import "@testing-library/jest-dom"
import {library} from "@fortawesome/fontawesome-svg-core";
import {fab} from "@fortawesome/free-brands-svg-icons";
import { UserInfoContext } from "../../src/components/userInfo/UserInfoContexts";
import {AuthToken, Status, User} from "tweeter-shared";
import {PostPresenter} from "../../src/model.presenter/PostPresenter";
import {instance, mock, verify} from "@typestrong/ts-mockito";

library.add(fab);

const authToken = new AuthToken("abc123", Date.now());
const newUser = new User("first", "last", "alias", "url");
describe("Post component", () => {
    it("starts with the post status and clear buttons disabled", () => {
        const {postStatusButton, clearButton} = renderPostAndGetElements();
        expect(postStatusButton).toBeDisabled();
        expect(clearButton).toBeDisabled();
    })

    it("both buttons are enabled when the status field has text", async () => {
        const {statusField, postStatusButton, clearButton, user} = renderPostAndGetElements();

        await user.type(statusField, "a");
        expect(postStatusButton).toBeEnabled();
        expect(clearButton).toBeEnabled();
    })

    it("disables both buttons when text field is cleared", async () => {
        const {statusField, postStatusButton, clearButton, user} = renderPostAndGetElements();

        await user.type(statusField, "a");
        expect(postStatusButton).toBeEnabled();
        expect(clearButton).toBeEnabled();
        await user.clear(statusField);
        expect(postStatusButton).toBeDisabled();
        expect(clearButton).toBeDisabled();
    })

    it("calls the presenters post method with correct parameters when the post status button is pressed", async () => {
        const mockPresenter = mock<PostPresenter>();
        const mockPresenterInstance = instance(mockPresenter);

        const {statusField, postStatusButton, user} = renderPostAndGetElements(mockPresenterInstance);
        await user.type(statusField, "a");
        await user.click(postStatusButton);
        verify(mockPresenter.submitPost("a", newUser, authToken)).once();
    })
})

function renderPost(presenter?: PostPresenter) {
    return render(
        <MemoryRouter>
            <UserInfoContext.Provider
                value={{
                    currentUser: newUser,
                    displayedUser: null,
                    authToken,
                }}
            >
                <PostStatus presenter={presenter} />
            </UserInfoContext.Provider>
        </MemoryRouter>
    );
}

function renderPostAndGetElements(presenter?: PostPresenter) {
    const user = userEvent.setup();

    renderPost(presenter);

    const statusField = screen.getByLabelText("status");
    const postStatusButton = screen.getByRole("button", {name: /post status/i});
    const clearButton = screen.getByRole("button", {name: /Clear/i});

    return {statusField, postStatusButton, clearButton, user};
}