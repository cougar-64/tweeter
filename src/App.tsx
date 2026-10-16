import "./App.css";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Login from "./components/authentication/login/Login";
import Register from "./components/authentication/register/Register";
import MainLayout from "./components/mainLayout/MainLayout";
import Toaster from "./components/toaster/Toaster";
import UserItemScroller from "./components/mainLayout/UserItemScroller";
import {UserInfoActionsHook, UserInfoHook} from "./components/userInfo/UserHooks";
import StatusItemScroller from "./components/statusItem/StatusItemScroller";
import {FolloweePresenter} from "./model.presenter/FolloweePresenter";
import {FollowerPresenter} from "./model.presenter/FollowerPresenter";
import {FeedPresenter} from "./model.presenter/FeedPresenter";
import {StoryPresenter} from "./model.presenter/StoryPresenter";
import {LoginPresenter} from "./model.presenter/LoginPresenter";
import {RegisterPresenter, RegisterView} from "./model.presenter/RegisterPresenter";
import {PagedItemView} from "./model.presenter/PagedItemPresenter";
import {Status, User} from "tweeter-shared";
import {AuthView} from "./model.presenter/AuthPresenter";

const App = () => {
  const { currentUser, authToken } = UserInfoHook();

  const isAuthenticated = (): boolean => {
    return !!currentUser && !!authToken;
  };

    console.log({
        currentUser,
        authToken,
        authenticated: !!currentUser && !!authToken,
    });

  return (
    <div>
      <Toaster position="top-right" />
      <BrowserRouter>
        {isAuthenticated() ? (
          <AuthenticatedRoutes />
        ) : (
          <UnauthenticatedRoutes />
        )}
      </BrowserRouter>
    </div>
  );
};

const AuthenticatedRoutes = () => {
  const { displayedUser } = UserInfoHook();

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to={`/feed/${displayedUser!.alias}`} />} />
        <Route path="feed/:displayedUser" element={<StatusItemScroller key={`feed=${displayedUser!.alias}`} featureUrl="/feed" presenterFactory={(view: PagedItemView<Status>) => new FeedPresenter(view)}/>} />
        <Route path="story/:displayedUser" element={<StatusItemScroller key={`story=${displayedUser!.alias}`} featureUrl="/story" presenterFactory={(view: PagedItemView<Status>) => new StoryPresenter(view)}/>} />
        <Route path="followees/:displayedUser" element={<UserItemScroller key={`followees=${displayedUser!.alias}`} featureUrl="/followees" presenterFactory={(view: PagedItemView<User>) => new FolloweePresenter(view)}/>} />
        <Route path="followers/:displayedUser" element={<UserItemScroller key={`followers=${displayedUser!.alias}`} featureUrl="/followers" presenterFactory={(view: PagedItemView<User>) => new FollowerPresenter(view)}/>} />
        <Route path="logout" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={`/feed/${displayedUser!.alias}`} />} />
      </Route>
    </Routes>
  );
};

const UnauthenticatedRoutes = () => {
  const location = useLocation();
  const userInfoActions = UserInfoActionsHook();

  return (
    <Routes>
      <Route path="/login" element={<Login presenterFactory={(view: AuthView)=> new LoginPresenter(view, userInfoActions)}/>} />
      <Route path="/register" element={<Register presenterFactory={(view: RegisterView) => new RegisterPresenter(view, userInfoActions)}/>} />
        <Route path="*" element={<Navigate to={`/login`} replace /> } />
    </Routes>
  );
};

export default App;
