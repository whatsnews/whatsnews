"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Settings, 
  MessageSquareText,
  Newspaper
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  isPrompt?: boolean;
}

const promptNav: NavItem[] = [
  { title: "Technology", href: "/prompts/technology", isPrompt: true },
  { title: "Politics", href: "/prompts/politics", isPrompt: true },
  { title: "Markets", href: "/prompts/markets", isPrompt: true },
  { title: "Startups in AI", href: "/prompts/startups-ai", isPrompt: true },
];

const bottomNav: NavItem[] = [
  {
    title: "My Prompts",
    href: "/prompts",
    icon: <MessageSquareText className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href;
    
    return (
      item.isPrompt ? (
        <Link
          href={item.href}
          className={`flex items-center gap-x-3 px-4 py-2.5 text-base rounded-md transition-all
            ${isActive 
              ? 'bg-primary/10 text-primary font-medium' 
              : 'text-foreground/70 hover:bg-primary/5 hover:text-primary/90'
            }
            pl-6`
          }
        >
          <Newspaper className="h-4 w-4 text-foreground/50" />
          <span>{item.title}</span>
        </Link>
      ) : (
        <Link
          href={item.href}
          className={`flex items-center gap-x-3 px-4 py-2.5 text-base rounded-md transition-all
            ${isActive 
              ? 'bg-primary/10 text-primary font-medium' 
              : 'text-foreground/70 hover:bg-primary/5 hover:text-primary/90'
            }`
          }
        >
          {item.icon}
          <span>{item.title}</span>
        </Link>
      )
    );
  };

  return (
    <div className="h-full w-60 border-r border-border/50 flex flex-col bg-background/50">
      {/* Logo - Only show in desktop view */}
      <div className="p-6 border-b border-border/50 hidden md:block">
        <h1 className="text-2xl font-semibold text-primary">whats news.</h1>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-6">
        {/* My News Label */}
        <div className="px-7 mb-3 text-xs font-medium text-foreground/50 uppercase tracking-wider">
          My News
        </div>

        {/* Prompts Section */}
        <div className="px-3 space-y-1">
          {promptNav.map((item) => (
            <NavLink key={item.title} item={item} />
          ))}
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-border/50 space-y-1 bg-background/50">
        {bottomNav.map((item) => (
          <NavLink key={item.title} item={item} />
        ))}
      </div>
    </div>
  );
}