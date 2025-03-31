import { Link } from "wouter";
import UserMenu from "@/components/auth/UserMenu";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-6">
          <Link href="/">
            <span className="flex items-center gap-2 font-semibold text-xl cursor-pointer">
              <span className="text-primary font-bold">Clustica - Magical</span>
            </span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/dashboard">
              <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Mes Livres
              </span>
            </Link>
            <Link href="/editor">
              <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Nouvel ouvrage
              </span>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}