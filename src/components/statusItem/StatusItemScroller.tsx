import InfiniteScroll from "react-infinite-scroll-component";
import {Link, useNavigate, useParams} from "react-router-dom";
import {AuthToken, FakeData, Status, User} from "tweeter-shared";
import React, {useEffect, useState} from "react";
import {useMessageActions} from "../toaster/MessageHooks";
import {UserInfoActionsHook, UserInfoHook, useUserNavigation} from "../userInfo/UserHooks";
import { PAGE_SIZE } from "../../model.presenter/UserItemPresenter"
import StatusItem from "../userItem/StatusItem";
import {StoryPresenter, StoryView} from "../../model.presenter/StoryPresenter";


interface Props {
    itemDescription: string;
    loadMore: (
            authToken: AuthToken,
            userAlias: string,
            pageSize: number,
            lastItem: Status | null
        ) => Promise<[Status[], boolean]>;
    featureUrl: string;
}

const StatusItemScroller= (props: Props) => {
    const { displayErrorMessage } = useMessageActions();
    const [items, setItems] = useState<Status[]>([]);
    const [hasMoreItems, setHasMoreItems] = useState(true);
    const [lastItem, setLastItem] = useState<Status | null>(null);
    const navigate = useNavigate();

    const addItems = (newItems: Status[]) =>
        setItems((previousItems) => [...previousItems, ...newItems]);

    const { displayedUser, authToken } = UserInfoHook();
    const { setDisplayedUser } = UserInfoActionsHook();
    const { displayedUser: displayedUserAliasParam } = useParams();

    const listener: StoryView = {

    }

    const presenter = new StoryPresenter(listener);

    // Update the displayed user context variable whenever the displayedUser url parameter changes. This allows browser forward and back buttons to work correctly.
    useEffect(() => {
        if (
            authToken &&
            displayedUserAliasParam &&
            displayedUserAliasParam != displayedUser!.alias
        ) {
            getUser(authToken!, displayedUserAliasParam!).then((toUser) => {
                if (toUser) {
                    setDisplayedUser(toUser);
                }
            });
        }
    }, [displayedUserAliasParam]);

    // Initialize the component whenever the displayed user changes
    useEffect(() => {
        reset();
        loadMoreItems(null);
    }, [displayedUser]);

    const reset = async () => {
        setItems(() => []);
        setLastItem(() => null);
        setHasMoreItems(() => true);
    };

    const loadMoreItems = async (lastItem: Status | null) => {
        try {
            const [newItems, hasMore] = await props.loadMore(
                authToken!,
                displayedUser!.alias,
                PAGE_SIZE,
                lastItem
            );

            setHasMoreItems(() => hasMore);
            setLastItem(() => newItems[newItems.length - 1]);
            addItems(newItems);
        } catch (error) {
            displayErrorMessage(
                `Failed to load ${props.itemDescription} items because of exception: ${error}`,
            );
        }
    };

    return (
        <div className="container px-0 overflow-visible vh-100">
            <InfiniteScroll
                className="pr-0 mr-0"
                dataLength={items.length}
                next={() => loadMoreItems(lastItem)}
                hasMore={hasMoreItems}
                loader={<h4>Loading...</h4>}
            >
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="row mb-3 mx-0 px-0 border rounded bg-white"
                    >
                        <StatusItem status={item} featurePath={props.featureUrl}/>
                    </div>
                    ))}
            </InfiniteScroll>
        </div>
    );

}

export default StatusItemScroller;