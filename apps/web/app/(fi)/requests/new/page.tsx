import { redirect } from "next/navigation";

export default function LegacyNewRequestRedirect() {
  redirect("/feedback/new");
}
