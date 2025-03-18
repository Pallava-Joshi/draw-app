import { useEffect, useState } from "react";
import { WS_URL } from "../app/config";
export function useSocket() {
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket>();


    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiOWNlMTU2ZC1jODM2LTQxYjctOWQzNS1hODA1YmJhYmJiMzAiLCJpYXQiOjE3NDIxNzU4OTN9.sg8BewVATN_L61YR3G0mvirZlPNbdMoW0KwnCxUFbIY`);
        ws.onopen = () => {
            setSocket(ws);
            setLoading(false);
        };
    }, []);

    return { loading, socket };
}