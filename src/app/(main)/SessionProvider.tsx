"use client"

import { Session, User } from "lucia";
import { createContext, PropsWithChildren, useContext } from "react"

interface SessionContextType {
    user: User;
    session: Session

    //we intentionally not making user: User | null and session: Session | null because we want to enforce that the user of this context must check for the existence of user and session before accessing their properties. This is done by throwing an error in the useSession hook if the context is not found, which means that the user is trying to access the session context outside of a SessionProvider. By doing this, we can ensure that the user of this context is always aware of the possibility of null values and handles them appropriately, rather than assuming that they will always be present and potentially causing runtime errors.
}

const SessionContext = createContext<SessionContextType | null>(null);

export default function SessionProvider({
    children,
    value
}: PropsWithChildren<{value: SessionContextType}>) { //this is a React utility type when we have some props along with children. So now we only have to define the type of value and children is automatically typed as React.ReactNode, which is the type for any valid React child (string, number, element, fragment, etc.)
    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    )
}


//we are creating a custom hook(function) to get context instead if just using useContext() in the components that need to access the session context. This is because we want to enforce that the user of this hook must check for the existence of user and session before accessing their properties. By throwing an error in the useSession hook if the context is not found, we can ensure that the user of this hook is always aware of the possibility of null values and handles them appropriately, rather than assuming that they will always be present and potentially causing runtime errors. Without this, if someone accidentally uses useSession() outside the provider, context would be null and cause a confusing runtime error somewhere deep in the code. With this check, you get a clear error message immediately telling you exactly what went wrong. We also don't have to do this again and again in every component.
export function useSession(){
    const context = useContext(SessionContext);
    if(!context){
        throw new Error("useSession must be used within a SessionProvider");
    }

    return context;
}