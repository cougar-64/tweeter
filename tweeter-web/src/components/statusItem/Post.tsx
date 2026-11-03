import { Link, useNavigate } from "react-router-dom";
import { Status, Type } from "tweeter-shared";
import {useMessageActions} from "../toaster/MessageHooks";
import {UserInfoActionsHook, UserInfoHook, useUserNavigation} from "../userInfo/UserHooks";

interface Props {
  status: Status;
  featurePath: string;
}

const Post = (props: Props) => {
  const { displayErrorMessage } = useMessageActions();
  const { displayedUser, authToken } = UserInfoHook();
  const { setDisplayedUser } = UserInfoActionsHook();

  const navigate = useNavigate();
  const navigateToUser = useUserNavigation(props.featurePath);

  return (
    <>
      {props.status.segments.map((segment, index) =>
        segment.type === Type.alias ? (
          <Link
            key={index}
            to={`${props.featurePath}/${segment.text}`}
            onClick={navigateToUser}
          >
            {segment.text}
          </Link>
        ) : segment.type === Type.url ? (
          <a
            key={index}
            href={segment.text}
            target="_blank"
            rel="noopener noreferrer"
          >
            {segment.text}
          </a>
        ) : segment.type === Type.newline ? (
          <br key={index} />
        ) : (
          segment.text
        )
      )}
    </>
  );
};

export default Post;
