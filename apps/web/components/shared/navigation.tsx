'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { cn } from '@/lib/utils';
import { isActiveRoute } from '@/lib/route';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/tournaments', label: 'Tournaments' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-xl">
            Jadval
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={active ? 'secondary' : 'ghost'}
                    className={cn(active && 'bg-secondary')}
                  >
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
