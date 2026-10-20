import {PagedItemView} from "../../model.presenter/PagedItemPresenter";
import {useMessageActions} from "../toaster/MessageHooks";
import {useEffect, useRef, useState} from "react";
import {UserInfoActionsHook, UserInfoHook} from "../userInfo/UserHooks";
import {useParams} from "react-router-dom";
import {UserItemPresenter} from "../../model.presenter/UserItemPresenter";
import {StatusItemPresenter} from "../../model.presenter/StatusItemPresenter";
import InfiniteScroll from "react-infinite-scroll-component";
import {Status, User} from "tweeter-shared";

// T is the User or Status, U is the Presenter
interface Props<T, U> {
    featureUrl: string;
    presenterFactory: (view: PagedItemView<T>) => U;
    scrollerFactory: (item: T, featurePath: string) => JSX.Element;
}

type allowed = UserItemPresenter | StatusItemPresenter;
type t_allowed = User | Status;

const ItemScroller = <T extends t_allowed, U extends allowed>(props: Props<T, U>)=> {
    const {displayErrorMessage} = useMessageActions();
    const [items, setItems] = useState<T[]>([]);
    const {displayedUser, authToken} = UserInfoHook()
    const {setDisplayedUser} = UserInfoActionsHook();
    const {displayedUser: displayedUserAliasParam} = useParams();

    const listener: PagedItemView<T> = {
        addItems: (newItems: T[]) =>
            setItems((previousItems) => [...previousItems, ...newItems]),
        displayErrorMessage: displayErrorMessage
    }

    const presenterRef = useRef<U | null>(null);
    if (!presenterRef.current) {
        presenterRef.current = props.presenterFactory(listener);
    }

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

    useEffect(() => {
        reset();
        loadMoreItems();
    }, [displayedUser]);

    const reset = async () => {
        setItems(() => []);
        presenterRef.current!.reset();
    };

    const loadMoreItems = async () =>{
        await presenterRef.current!.loadMoreItems(authToken!, displayedUser!.alias)
    };


    return (
        <div className="container px-0 overflow-visible vh-100">
            <InfiniteScroll
                className="pr-0 mr-0"
                dataLength={items.length}
                next={loadMoreItems}
                hasMore={presenterRef.current!.hasMoreItems}
                loader={<h4>Loading...</h4>}
            >
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="row mb-3 mx-0 px-0 border rounded bg-white"
                    >
                        {props.scrollerFactory(item, props.featureUrl)}
                    </div>
                ))}
            </InfiniteScroll>
        </div>
    );
}

export default ItemScroller;