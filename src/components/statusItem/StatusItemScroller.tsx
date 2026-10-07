import InfiniteScroll from "react-infinite-scroll-component";
import {useParams} from "react-router-dom";
import { Status} from "tweeter-shared";
import React, {useEffect, useRef, useState} from "react";
import {useMessageActions} from "../toaster/MessageHooks";
import {UserInfoActionsHook, UserInfoHook, useUserNavigation} from "../userInfo/UserHooks";
import StatusItem from "../userItem/StatusItem";
import {StatusItemPresenter, StatusItemView} from "../../model.presenter/StatusItemPresenter"


interface Props {// this is what gets passed down from App.tsx for rendering
    featureUrl: string;
    presenterFactory: (view: StatusItemView) => StatusItemPresenter;
}

const StatusItemScroller= (props: Props) => {
    const { displayErrorMessage } = useMessageActions();
    const [items, setItems] = useState<Status[]>([]);

    const { displayedUser, authToken } = UserInfoHook();
    const { setDisplayedUser } = UserInfoActionsHook();
    const { displayedUser: displayedUserAliasParam } = useParams();

    const listener: StatusItemView = {
        addItems: (newItems: Status[]) =>
            setItems((previousItems) => [...previousItems, ...newItems]),
        displayErrorMessage: displayErrorMessage
    }

    const presenterRef = useRef<StatusItemPresenter | null>(null)
        if (!presenterRef.current) {
            presenterRef.current = props.presenterFactory(listener);
    }

    // Update the displayed user context variable whenever the displayedUser url parameter changes. This allows browser forward and back buttons to work correctly.
    useEffect(() => {
        if (
            authToken &&
            displayedUserAliasParam &&
            displayedUserAliasParam != displayedUser!.alias
        ) {
            presenterRef.current!.getUser(authToken!, displayedUserAliasParam!).then((toUser) => {
                if (toUser) {
                    setDisplayedUser(toUser);
                }
            });
        }
    }, [displayedUserAliasParam]);

    // Initialize the component whenever the displayed user changes
    useEffect(() => {
        reset();
        loadMoreItems();
    }, [displayedUser]);

    const reset = async () => {
        setItems(() => []);
        presenterRef.current!.reset();
    };

    const loadMoreItems = async () => {
        presenterRef.current!.loadMoreItems(authToken!, displayedUser!.alias);
    };

    return (
        <div className="container px-0 overflow-visible vh-100">
            <InfiniteScroll
                className="pr-0 mr-0"
                dataLength={items.length}
                next={() => loadMoreItems()}
                hasMore={presenterRef.current!.hasMoreItems}
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