// AI-assisted: see AI-ATTRIBUTION.md
import type { FeedDAO } from "./FeedDAO";
import type { FollowDAO } from "./FollowDAO";
import type { AuthenticationDAOFactory } from "./AuthenticationDAOFactory";
import type { StoryDAO } from "./StoryDAO";

/** Services receive this abstraction; the Lambda composition selects its implementation. */
export interface DAOFactory extends AuthenticationDAOFactory {
  createFollowDAO(): FollowDAO;
  createStoryDAO(): StoryDAO;
  createFeedDAO(): FeedDAO;
}
