import { pusherServer } from "@/lib/pusher";
import { getCurrentUserAction } from "@/app/actions/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await req.formData();
    const socketId = data.get("socket_id") as string;
    const channelName = data.get("channel_name") as string;

    if (!socketId || !channelName) {
      return new NextResponse("Missing params", { status: 400 });
    }

    // For presence channels, we attach user data
    const presenceData = {
      user_id: user.id,
      user_info: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };

    const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData);
    
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
