import "./Login.css";
import "bootstrap/dist/css/bootstrap.css";
import {useRef, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthenticationFormLayout from "../AuthenticationFormLayout";
import AuthenticationFields from "../AuthenticationFields"
import {useMessageActions} from "../../toaster/MessageHooks";
import {LoginPresenter} from "../../../model.presenter/LoginPresenter";
import {AuthPresenter, AuthView} from "../../../model.presenter/AuthPresenter";

interface Props {
  originalUrl?: string;
  presenterFactory: (view: AuthView) => LoginPresenter;
  presenter?: LoginPresenter;
}

const Login = (props: Props) => {
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { displayErrorMessage } = useMessageActions();
  const [isLoading] = useState(false);
  const navigate = useNavigate();

  const listener: AuthView = {
    navigate: navigate,
    displayErrorMessage: displayErrorMessage,
    setImageUrl: url => {},
    setImageBytes: array => {},
    setImageFileExtension: extension => {},
  }

  const presenterRef = useRef<AuthPresenter | null>(null);
  if (!presenterRef.current) {
    presenterRef.current = props.presenter ?? props.presenterFactory(listener);
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
      console.log("doLogin fired"); // this fires

      await presenterRef.current!.getIn(alias, password, rememberMe, props.originalUrl,); // POTENTIAL BUG HERE BY REARRANGING VAR INPUT
      console.log("doLogin successful")
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
