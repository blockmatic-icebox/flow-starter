import { ChatClient } from "./chat-client";

export default function ChatPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold">
        Ask Feature Intelligence
      </h1>
      <ChatClient />
    </div>
  );
}
