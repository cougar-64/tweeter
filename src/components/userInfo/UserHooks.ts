// create UserInfoContext
// create UserInfoActions hook


import {useContext} from "react";
import {UserInfoActionsContext, UserInfoContext} from "./UserInfoContexts";

export const UserInfoHook = () => {
    return useContext(UserInfoContext);
};

export const UserInfoActionsHook = () => {
    return useContext(UserInfoActionsContext);
};