import React from "react";


interface Props {
    setAlias: React.Dispatch<React.SetStateAction<string>>;
    setPassword: React.Dispatch<React.SetStateAction<string>>;
    handleSubmit: () => void; //
    checkSubmitButtonStatus: () => boolean; // checks
}

const AuthenticationFields = (props: Props) => {
    const getInOnEnter = (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key == "Enter" && !props.checkSubmitButtonStatus()) {
            props.handleSubmit();
        }
    };
    return (
        <>
        <div className="form-floating">
            <input
                type="text"
                className="form-control"
                size={50}
                id="aliasInput"
                placeholder="name@example.com"
                onKeyDown={getInOnEnter}
                onChange={(event) => props.setAlias(event.target.value)}
            />
            <label htmlFor="aliasInput">Alias</label>
        </div>
    <div className="form-floating mb-3">
        <input
            type="password"
            className="form-control bottom"
            id="passwordInput"
            placeholder="Password"
            onKeyDown={getInOnEnter}
            onChange={(event) => props.setPassword(event.target.value)}
        />
        <label htmlFor="passwordInput">Password</label>
    </div>
</>
    );
}

export default AuthenticationFields;