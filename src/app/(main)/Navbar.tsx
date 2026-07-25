import { SearchField } from "@/components/SearchField";
import { UserButton } from "@/components/UserButton";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 bg-card z-10 shadow-sm ">
      <div className="mx-auto max-w-7xl flex items-center gap-5 justify-center flex-wrap px-5 py-3">
        <Link href="/" className="text-2xl font-bold text-primary ">
          ━═★ bluebeam ★═━
        </Link>

        <SearchField />
        <UserButton className="sm:ml-auto" />
      </div>
    </header>
  );
}
