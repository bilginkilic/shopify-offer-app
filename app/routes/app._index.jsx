import { redirect } from "@remix-run/node";

export function loader() {
  return redirect("/app/offers");
}

export default function AppIndex() {
  return null;
}
