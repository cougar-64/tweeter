import "./Login.css";
import "bootstrap/dist/css/bootstrap.css";
import {useRef, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthenticationFormLayout from "../AuthenticationFormLayout";
import AuthenticationFields from "../AuthenticationFields"
import {useMessageActions} from "../../toaster/MessageHooks";
import {UserInfoActionsHook} from "../../userInfo/UserHooks";
import {AuthItemPresenter, AuthItemView} from "../../../model.presenter/AuthItemPresenter";

interface Props {
  originalUrl?: string;
  presenterFactory: (view: AuthItemView) => AuthItemPresenter;
}

const Login = (props: Props) => {
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { updateUserInfo } = UserInfoActionsHook();
  const { displayErrorMessage } = useMessageActions();

  const listener: AuthItemView = {
    displayErrorMessage: displayErrorMessage
    // how do I know what to put here??
  }

  const presenterRef = useRef<AuthItemPresenter | null>(null);
  if (!presenterRef.current) {
    presenterRef.current = props.presenterFactory(listener);
  }

  const checkSubmitButtonStatus = (): boolean => {
    return !presenterRef.current!.alias || !presenterRef.current!.password;
  };

  const loginOnEnter = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key == "Enter" && !checkSubmitButtonStatus()) {
      presenterRef.current!.getIn(presenterRef.current!.alias!, presenterRef.current!.alias!); // works because of checkSubmitButtonStatus above
    }
  };

    const doLogin = async () => {
      presenterRef.current!.doGetIn(rememberMe, props.originalUrl);
    }
  // const doLogin = async () => {
  //   try {
  //     setIsLoading(true);
  //
  //     const [user, authToken] = await login(alias, password);
  //
  //     updateUserInfo(user, user, authToken, rememberMe);
  //
  //     if (!!props.originalUrl) {
  //       navigate(props.originalUrl);
  //     } else {
  //       navigate(`/feed/${user.alias}`);
  //     }
  //   } catch (error) {
  //     displayErrorMessage(
  //       `Failed to log user in because of exception: ${error}`,
  //     );
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const login = async (
  //   alias: string,
  //   password: string
  // ): Promise<[User, AuthToken]> => {
  //   // TODO: Replace with the result of calling the server
  //   const user = FakeData.instance.firstUser;
  //
  //   if (user === null) {
  //     throw new Error("Invalid alias or password");
  //   }
  //
  //   return [user, FakeData.instance.authToken];
  // };

  const inputFieldFactory = () => {
    return (
      <>
        <AuthenticationFields setAlias={setAlias}
                              setPassword={setPassword}
                              handleSubmit={presenterRef.current?.doGetIn(rememberMe, props.originalUrl)}
                              checkSubmitButtonStatus={checkSubmitButtonStatus}/>
      </>
    );
  };

  const switchAuthenticationMethodFactory = () => {
    return (
      <div className="mb-3">
        Not registered? <Link to="/register">Register</Link>
      </div>
    );
  };

  return (
    <AuthenticationFormLayout
      headingText="Please Sign In"
      submitButtonLabel="Sign in"
      oAuthHeading="Sign in with:"
      inputFieldFactory={inputFieldFactory}
      switchAuthenticationMethodFactory={switchAuthenticationMethodFactory}
      setRememberMe={setRememberMe}
      submitButtonDisabled={checkSubmitButtonStatus}
      isLoading={isLoading}
      submit={presenterRef.current!.doGetIn(rememberMe)}
    />
  );
};

export default Login;
