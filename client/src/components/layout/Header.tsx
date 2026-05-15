import { Package } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-card)] sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-[var(--color-primary)]" />
          <span className="font-semibold text-[var(--color-foreground)]">PackageTracker</span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
