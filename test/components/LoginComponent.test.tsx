import Login from "../../src/components/authentication/login/Login";
import {AuthView} from "../../src/model.presenter/AuthPresenter";
import {render, screen} from "@testing-library/react"
import {MemoryRouter} from "react-router-dom";
import {userEvent} from "@testing-library/user-event/dist/cjs/setup/index.js";
import {LoginPresenter} from "../../src/model.presenter/LoginPresenter";
import {UserInfoActionsHook} from "../../src/components/userInfo/UserHooks";
import "@testing-library/jest-dom"
import {instance, mock, verify} from "@typestrong/ts-mockito";
import {library} from "@fortawesome/fontawesome-svg-core";
import {fab} from "@fortawesome/free-brands-svg-icons";

library.add(fab);

describe("Login component", () => {
    it("starts with the sign-in button disabled", () => {
        const { signInButton } = renderLoginAndGetElements("/");
        expect(signInButton).toBeDisabled();
    })

    it("enables the sign-in button if both alias and password fields have text", async () => {
        const { signInButton, aliasField, passwordField, user } = renderLoginAndGetElements("/");

        await user.type(aliasField, "a");
        await user.type(passwordField, "b'");

        expect(signInButton).toBeEnabled();
    })

    it("disables the sign-in button if either the alias or password field is cleared", async () => {
        const { signInButton, aliasField, passwordField, user } = renderLoginAndGetElements("/");

        await user.type(aliasField, "a");
        await user.type(passwordField, "b'");

        expect(signInButton).toBeEnabled();

        await user.clear(aliasField);
        expect(signInButton).toBeDisabled();
        await user.type(aliasField, "a");
        await user.clear(passwordField);
        expect(signInButton).toBeDisabled();
    })

    it("calls the presenters login method with correct parameters when the sign-in button is pressed", async () => {
        const mockPresenter = mock<LoginPresenter>();
        const mockPresenterInstance = instance(mockPresenter);

        const originalUrl = "http://somewhere.com";
        const alias = "alias";
        const password = "password";
        const { signInButton, aliasField, passwordField, user } = renderLoginAndGetElements(originalUrl, mockPresenterInstance);
        await user.type(aliasField, alias);
        await user.type(passwordField, password);

        await user.click(signInButton);
        verify(mockPresenter.getIn(alias, password, false, originalUrl)).once()
    })
})

function LoginWithPresenter({originalUrl, presenter,}: {
    originalUrl: string;
    presenter?: LoginPresenter;
}) {
    const userInfoActions = UserInfoActionsHook();

    return (
        <Login
            originalUrl={originalUrl}
            presenter={presenter}
            presenterFactory={(view: AuthView) =>
                new LoginPresenter(view, userInfoActions)
            }
        />
    );
}

function renderLogin(
    originalUrl: string,
    presenter?: LoginPresenter
) {
    return render(
        <MemoryRouter>
            <LoginWithPresenter
                originalUrl={originalUrl}
                presenter={presenter}
            />
        </MemoryRouter>
    );
}

function renderLoginAndGetElements(originalUrl: string, presenter?: LoginPresenter) {
    const user = userEvent.setup();

    renderLogin(originalUrl, presenter);

    const signInButton = screen.getByRole("button", { name: /Sign in/i});
    const aliasField = screen.getByLabelText("alias");
    const passwordField = screen.getByLabelText("password");

    return {user, signInButton, aliasField, passwordField};
}