import { redirect } from "next/navigation";

export default function Signout() {
  redirect("/auth/login");
}
