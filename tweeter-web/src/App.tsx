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
import {UserInfoActionsHook, UserInfoHook} from "./components/userInfo/UserHooks";
import {FolloweePresenter} from "./model.presenter/FolloweePresenter";
import {FollowerPresenter} from "./model.presenter/FollowerPresenter";
import {FeedPresenter} from "./model.presenter/FeedPresenter";
import {StoryPresenter} from "./model.presenter/StoryPresenter";
import {LoginPresenter} from "./model.presenter/LoginPresenter";
import {RegisterPresenter} from "./model.presenter/RegisterPresenter";
import {PagedItemView} from "./model.presenter/PagedItemPresenter";
import {Status, User} from "tweeter-shared";
import {AuthView} from "./model.presenter/AuthPresenter";
import ItemScroller from "./components/mainLayout/ItemScroller";
import UserItem from "./components/userItem/UserItem";
import StatusItem from "./components/userItem/StatusItem";

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

    const userItemFactory = (item: User, featurePath: string) => (
        <UserItem user={item} featurePath={featurePath} />
    );
    const statusItemFactory = (item: Status, featurePath: string) => (
        <StatusItem status={item} featurePath={featurePath} />
    );

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to={`/feed/${displayedUser!.alias}`} />} />
        <Route path="feed/:displayedUser" element={<ItemScroller key={`feed=${displayedUser!.alias}`} featureUrl="/feed" presenterFactory={(view: PagedItemView<Status>) => new FeedPresenter(view)} scrollerFactory={statusItemFactory}/>} />
        <Route path="story/:displayedUser" element={<ItemScroller key={`story=${displayedUser!.alias}`} featureUrl="/story" presenterFactory={(view: PagedItemView<Status>) => new StoryPresenter(view)} scrollerFactory={statusItemFactory}/>} />
        <Route path="followees/:displayedUser" element={<ItemScroller key={`followees=${displayedUser!.alias}`} featureUrl="/followees" presenterFactory={(view: PagedItemView<User>) => new FolloweePresenter(view)} scrollerFactory={userItemFactory}/>} />
        <Route path="followers/:displayedUser" element={<ItemScroller key={`followers=${displayedUser!.alias}`} featureUrl="/followers" presenterFactory={(view: PagedItemView<User>) => new FollowerPresenter(view)} scrollerFactory={userItemFactory}/>} />
        <Route path="logout" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={`/feed/${displayedUser!.alias}`} />} />
      </Route>
    </Routes>
  );
};

const UnauthenticatedRoutes = () => {
  const userInfoActions = UserInfoActionsHook();

  return (
    <Routes>
      <Route path="/login" element={<Login presenterFactory={(view: AuthView)=> new LoginPresenter(view, userInfoActions)}/>} />
      <Route path="/register" element={<Register presenterFactory={(view: AuthView) => new RegisterPresenter(view, userInfoActions)}/>} />
        <Route path="*" element={<Navigate to={`/login`} replace /> } />
    </Routes>
  );
};

export default App;

// functions as parameters deduplicates by allowing the code to have the same logic executed while calling different class methods.

// the template pattern doesn't require functions to be passed as parameters, sometimes you can simply execute the logic
// differently in the template pattern. Functions passed as parameters will always require... functions passed as parameters.
