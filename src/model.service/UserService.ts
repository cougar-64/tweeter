import {AuthToken, FakeData, User} from "tweeter-shared";

// for displayed user, logout, sign in/register, etc.
export class UserService {
    public async getUser (
        authToken: AuthToken,
        alias: string
    ): Promise<User | null> {
        // TODO: Replace with the result of calling server
        return FakeData.instance.findUserByAlias(alias);
    };
}