import { useState, useEffect, useRef } from "react";
import { StreamVideoClient } from "@stream-io/video-react-sdk";
import { StreamChat } from "stream-chat";

export function useStreamClients({ apiKey, user, token }) {
  const [videoClient, setVideoClient] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const videoClientRef = useRef(null);
  const chatClientRef = useRef(null);

  useEffect(() => {
    if (!user || !token || !apiKey) return;

    let isMounted = true;

    const initClients = async () => {
      try {
        // Initialize Video Client
        const tokenProvider = () => Promise.resolve(token);
        const myVideoClient = new StreamVideoClient({
          apiKey,
          user,
          tokenProvider,
        });

        // Initialize Chat Client
        const myChatClient = StreamChat.getInstance(apiKey);
        await myChatClient.connectUser(user, token);

        if (isMounted) {
          videoClientRef.current = myVideoClient;
          chatClientRef.current = myChatClient;
          setVideoClient(myVideoClient);
          setChatClient(myChatClient);
        }
      } catch (error) {
        console.error("Client initialization error:", error);
      }
    };

    initClients();

    return () => {
      isMounted = false;
      // Cleanup using refs to avoid stale closure
      if (videoClientRef.current) {
        videoClientRef.current.disconnectUser().catch(console.error);
        videoClientRef.current = null;
      }
      if (chatClientRef.current) {
        chatClientRef.current.disconnectUser().catch(console.error);
        chatClientRef.current = null;
      }
    };
  }, [apiKey, user?.id, token]);

  return { videoClient, chatClient };
}