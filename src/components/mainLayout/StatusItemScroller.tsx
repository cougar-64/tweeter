import InfiniteScroll from "react-infinite-scroll-component";
import {Link} from "react-router-dom";
import Post from "../statusItem/Post";
import {Status} from "tweeter-shared";
import React from "react";


interface Props {
    items: Status[];
    lastItem: Status | null;
    loadMore: (lastItem: Status | null) => void;
    hasMoreItems: boolean;
    navigateToUser: (event: React.MouseEvent) => Promise<void>;
    featureUrl: string;
}

const StatusItemScroller= (props: Props) => {
    return (
        <div className="container px-0 overflow-visible vh-100">
            <InfiniteScroll
                className="pr-0 mr-0"
                dataLength={props.items.length}
                next={() => props.loadMore(props.lastItem)}
                hasMore={props.hasMoreItems}
                loader={<h4>Loading...</h4>}
            >
                {props.items.map((item, index) => (
                    <div
                        key={index}
                        className="row mb-3 mx-0 px-0 border rounded bg-white"
                    >
                        <div className="col bg-light mx-0 px-0">
                            <div className="container px-0">
                                <div className="row mx-0 px-0">
                                    <div className="col-auto p-3">
                                        <img
                                            src={item.user.imageUrl}
                                            className="img-fluid"
                                            width="80"
                                            alt="Posting user"
                                        />
                                    </div>
                                    <div className="col">
                                        <h2>
                                            <b>
                                                {item.user.firstName} {item.user.lastName}
                                            </b>{" "}
                                            -{" "}
                                            <Link
                                                to={`${props.featureUrl}/${item.user.alias}`}
                                                onClick={props.navigateToUser}
                                            >
                                                {item.user.alias}
                                            </Link>
                                        </h2>
                                        {item.formattedDate}
                                        <br />
                                        <Post status={item} featurePath={props.featureUrl} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </InfiniteScroll>
        </div>
    );
}

export default StatusItemScroller;