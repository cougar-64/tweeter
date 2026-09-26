// create UserInfoContext
// create UserInfoActions hook


import {useContext} from "react";
import {UserInfoActionsContext, UserInfoContext} from "./UserInfoContexts";
import {AuthToken, FakeData, User} from "tweeter-shared";
import {useMessageActions} from "../toaster/MessageHooks";
import {useNavigate} from "react-router-dom";


export const UserInfoHook = () => {
    return useContext(UserInfoContext);
};

export const UserInfoActionsHook = () => {
    return useContext(UserInfoActionsContext);
};

export const useUserNavigation = (featurePath: string) => {
    const { displayErrorMessage } = useMessageActions();
    const { displayedUser, authToken } = UserInfoHook();
    const { setDisplayedUser } = UserInfoActionsHook();

    const navigate = useNavigate();

    const navigateToUser = async (event: React.MouseEvent): Promise<void> => {
        event.preventDefault();

        try {
            const alias = extractAlias(event.target.toString());

            const toUser = await getUser(authToken!, alias);

            if (toUser) {
                if (!toUser.equals(displayedUser!)) {
                    setDisplayedUser(toUser);
                    navigate(`${featurePath}/${toUser.alias}`);
                }
            }
        } catch (error) {
            displayErrorMessage(
                `Failed to get user because of exception: ${error}`,
            );
        }
    };

    const extractAlias = (value: string): string => {
        const index = value.indexOf("@");
        return value.substring(index);
    };

    const getUser = async (
        authToken: AuthToken,
        alias: string
    ): Promise<User | null> => {
        // TODO: Replace with the result of calling server
        return FakeData.instance.findUserByAlias(alias);
    };
    return navigateToUser;
}
