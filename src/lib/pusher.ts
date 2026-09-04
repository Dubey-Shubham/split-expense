import PusherServer from "pusher";
import PusherClient from "pusher-js";

// Ensure we don't instantiate multiple PusherServer instances in dev mode (hot reloading)
const globalForPusher = globalThis as unknown as {
  pusherServer: PusherServer | undefined;
};

export const pusherServer =
  globalForPusher.pusherServer ||
  new PusherServer({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPusher.pusherServer = pusherServer;
}

// Client setup
// In components, you should initialize this inside a useEffect or outside component scope
export const getPusherClient = () => {
  if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
    throw new Error("Missing NEXT_PUBLIC_PUSHER_KEY");
  }

  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    authEndpoint: "/api/pusher/auth",
  });
};
