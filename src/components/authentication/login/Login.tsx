import "./Login.css";
import "bootstrap/dist/css/bootstrap.css";
import {useRef, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthenticationFormLayout from "../AuthenticationFormLayout";
import AuthenticationFields from "../AuthenticationFields"
import {useMessageActions} from "../../toaster/MessageHooks";
import {LoginPresenter, LoginView} from "../../../model.presenter/LoginPresenter";

interface Props {
  originalUrl?: string;
  presenterFactory: (view: LoginView) => LoginPresenter;
}

const Login = (props: Props) => {
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { displayErrorMessage } = useMessageActions();
  const [isLoading] = useState(false);
  const navigate = useNavigate();

  const listener: LoginView = {
    navigate: navigate,
    displayErrorMessage: displayErrorMessage
    // how do I know what to put here??
  }

  const presenterRef = useRef<LoginPresenter | null>(null);
  if (!presenterRef.current) {
    presenterRef.current = props.presenterFactory(listener);
  }

  const checkSubmitButtonStatus = (): boolean => {
    return !alias || !password;
  };

  const loginOnEnter = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key == "Enter" && !checkSubmitButtonStatus()) {
      doLogin();// works because of checkSubmitButtonStatus above
    }
  };

    const doLogin = async () => {
      await presenterRef.current!.login(alias, password, props.originalUrl);
    }



  const inputFieldFactory = () => {
    return (
      <>
        <AuthenticationFields setAlias={setAlias}
                              setPassword={setPassword}
                              handleSubmit={loginOnEnter}
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
      submit={doLogin}
    />
  );
};

export default Login;
