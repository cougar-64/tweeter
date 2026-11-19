// AI-assisted: see AI-ATTRIBUTION.md
import type { FeedDAO } from "./FeedDAO";
import type { FollowDAO } from "./FollowDAO";
import type { ImageDAO } from "./ImageDAO";
import type { SessionDAO } from "./SessionDAO";
import type { StoryDAO } from "./StoryDAO";
import type { UserDAO } from "./UserDAO";

/** Services receive this abstraction; the Lambda composition selects its implementation. */
export interface DAOFactory {
  createUserDAO(): UserDAO;
  createSessionDAO(): SessionDAO;
  createFollowDAO(): FollowDAO;
  createStoryDAO(): StoryDAO;
  createFeedDAO(): FeedDAO;
  createImageDAO(): ImageDAO;
}
