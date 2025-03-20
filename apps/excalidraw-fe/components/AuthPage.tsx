"use client"
import { Button }  from "@repo/ui/button";

export function AuthPage({isSignin} : {isSignin : boolean}) {
    return <div className="flex flex-col items-center justify-center h-screen w-screen">
        <div className="bg-white p-6 text-background rounded-3xl"> 
            <div className="p-6">
                <input
                    type="text"
                    placeholder="Username"
                    className="outline-none bg-transparent placeholder:text-gray-400
                    focus:ring-0 focus:border-0"
                />
            </div>
            <div className="p-6">
                <input
                    type="password"
                    placeholder="Password"
                    className="outline-none bg-transparent placeholder:text-gray-400
                    focus:ring-0 focus:border-0"
                />
            </div>
            <Button onClick={() => {alert("hi there")}} className="button-primary w-full">{isSignin ? "Sign In" : "Sign Up"}</Button>
        </div>
    </div>
}
    