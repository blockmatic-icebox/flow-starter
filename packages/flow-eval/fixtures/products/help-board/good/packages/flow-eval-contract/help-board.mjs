export function runAcceptance() {
  const posts = [];
  const flags = [];
  const post = ({ author, body }) => {
    const id = String(posts.length + 1);
    posts.push({ author, body, id });
    return id;
  };
  const reply = ({ body, postId }) => {
    const row = posts.find((p) => p.id === postId);
    if (!row) throw new Error("missing post");
    row.replies = [...(row.replies ?? []), body];
  };
  const flag = ({ postId, reason }) => flags.push({ postId, reason });
  const id = post({ author: "n1", body: "Need ladder" });
  reply({ body: "I have one", postId: id });
  flag({ postId: id, reason: "spam" });
  if (flags.length !== 1) throw new Error("flag queue missing");
}
