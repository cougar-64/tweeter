// AI-assisted: see AI-ATTRIBUTION.md
// validates JSON responses and reconstructs User objects.
import { AuthToken, User } from "tweeter-shared";
import type { AuthenticationResponse, AuthTokenDto, CountResponse, FollowingStatusRequest, FollowingStatusResponse, GetUserResponse, LoginRequest, PagedUserItemRequest, PagedUserItemResponse, TweeterResponse, UserAliasRequest, UserDto } from "tweeter-shared";
import { ClientCommunicator } from "./ClientCommunicator";

export class ServerFacade {
  private readonly clientCommunicator: ClientCommunicator;

  public constructor(
    serverUrl: string = "https://s58iqa332m.execute-api.us-east-1.amazonaws.com/dev"
  ) {
    this.clientCommunicator = new ClientCommunicator(serverUrl);
  }

  public async login(request: LoginRequest): Promise<[User, AuthToken]> {
    const response = await this.clientCommunicator.doPost<LoginRequest, AuthenticationResponse>(
      request, "/user/login"
    );
    if (!response.success) {
      throw new Error(response.message ?? "Failed to login.");
    }
    if (!this.isUserDto(response.user) || !this.isAuthTokenDto(response.authToken)) {
      throw new Error("Invalid login response.");
    }
    return [User.fromDto(response.user), AuthToken.fromDto(response.authToken)];
  }

  public async getUser(request: UserAliasRequest): Promise<User | null> {
    const response = await this.clientCommunicator.doPost<UserAliasRequest, GetUserResponse>(
      request, "/user/get"
    );
    if (!response.success) {
      throw new Error(response.message ?? "Failed to get user.");
    }
    if (response.user === null) {
      return null;
    }
    if (!this.isUserDto(response.user)) {
      throw new Error("Invalid get user response.");
    }
    return User.fromDto(response.user);
  }

  public async getMoreFollowers(request: PagedUserItemRequest): Promise<[User[], boolean]> {
    return this.getPagedUsers(request, "/followers/list", "followers");
  }

  public async getMoreFollowees(request: PagedUserItemRequest): Promise<[User[], boolean]> {
    return this.getPagedUsers(request, "/followees/list", "followees");
  }

  public async follow(request: UserAliasRequest): Promise<void> {
    return this.performUserAction(request, "/follow", "follow");
  }

  public async unfollow(request: UserAliasRequest): Promise<void> {
    return this.performUserAction(request, "/unfollow", "unfollow");
  }

  private async performUserAction(
    request: UserAliasRequest,
    endpoint: string,
    action: string
  ): Promise<void> {
    const response = await this.clientCommunicator.doPost<UserAliasRequest, TweeterResponse>(
      request, endpoint
    );
    if (!response.success) {
      throw new Error(response.message ?? `Failed to ${action} user.`);
    }
  }

  public async getIsFollowerStatus(request: FollowingStatusRequest): Promise<boolean> {
    const response = await this.clientCommunicator.doPost<FollowingStatusRequest, FollowingStatusResponse>(
      request, "/follow/status"
    );
    if (!response.success) {
      throw new Error(response.message ?? "Failed to load following status.");
    }
    if (typeof response.isFollower !== "boolean") {
      throw new Error("Invalid following status response.");
    }
    return response.isFollower;
  }

  public async getFollowerCount(request: UserAliasRequest): Promise<number> {
    return this.getCount(request, "/followers/count", "follower");
  }

  public async getFolloweeCount(request: UserAliasRequest): Promise<number> {
    return this.getCount(request, "/followees/count", "followee");
  }

  private async getCount(
    request: UserAliasRequest,
    endpoint: string,
    itemDescription: string
  ): Promise<number> {
    const response = await this.clientCommunicator.doPost<UserAliasRequest, CountResponse>(
      request, endpoint
    );
    if (!response.success) {
      throw new Error(response.message ?? `Failed to load ${itemDescription} count.`);
    }
    if (!Number.isInteger(response.count) || response.count < 0) {
      throw new Error(`Invalid ${itemDescription} count response.`);
    }
    return response.count;
  }

  private async getPagedUsers(
    request: PagedUserItemRequest,
    endpoint: string,
    itemDescription: string
  ): Promise<[User[], boolean]> {
    const response = await this.clientCommunicator.doPost<
      PagedUserItemRequest,
      PagedUserItemResponse
    >(request, endpoint);

    if (!response.success) {
      throw new Error(response.message ?? `Failed to load ${itemDescription}.`);
    }
    if (
      !Array.isArray(response.items) ||
      !response.items.every((item: unknown) => this.isUserDto(item)) ||
      typeof response.hasMore !== "boolean"
    ) {
      throw new Error(`Invalid ${itemDescription} response.`);
    }

    return [response.items.map((dto) => User.fromDto(dto)), response.hasMore];
  }

  private isAuthTokenDto(value: unknown): value is AuthTokenDto {
    if (typeof value !== "object" || value === null) {
      return false;
    }
    const token = value as Partial<AuthTokenDto>;
    return (
      typeof token.token === "string" && token.token.trim().length > 0 &&
      typeof token.timestamp === "number" && Number.isFinite(token.timestamp) && token.timestamp >= 0
    );
  }

  private isUserDto(value: unknown): value is UserDto {
    if (typeof value !== "object" || value === null) {
      return false;
    }
    const user = value as Partial<UserDto>;
    return (
      typeof user.firstName === "string" &&
      typeof user.lastName === "string" &&
      typeof user.alias === "string" &&
      typeof user.imageUrl === "string"
    );
  }
}
