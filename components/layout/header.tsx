'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Heart, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatedSection } from '@/components/ui/animated-section';
import { usePathname } from 'next/navigation';

interface MenuItem {
  id: string;
  title: string;
  url: string | null;
  order_position: number;
  parent_id?: string | null;
  children?: MenuItem[];
}

interface HeaderProps {
  menuItems?: MenuItem[];
}

export function Header({ menuItems = [] }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [focusedItem, setFocusedItem] = useState<string | null>(null);
  const pathname = usePathname();

  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLElement>(null);
  const dropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  const buildMenuHierarchy = (items: MenuItem[]): MenuItem[] => {
    if (!items || items.length === 0) return [];

    const itemMap = new Map<string, MenuItem>();
    const rootItems: MenuItem[] = [];

    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    items.forEach(item => {
      const menuItem = itemMap.get(item.id)!;
      if (item.parent_id && itemMap.has(item.parent_id)) {
        const parent = itemMap.get(item.parent_id)!;
        if (!parent.children) parent.children = [];
        parent.children.push(menuItem);
      } else {
        rootItems.push(menuItem);
      }
    });

    rootItems.sort((a, b) => a.order_position - b.order_position);
    rootItems.forEach(item => {
      if (item.children && item.children.length > 0) {
        item.children.sort((a, b) => a.order_position - b.order_position);
      }
    });

    return rootItems;
  };

  const hierarchicalItems = buildMenuHierarchy(menuItems);

  const handleMouseEnter = useCallback((itemId: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setActiveDropdown(itemId);
  }, []);

  const handleMouseLeave = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
      setFocusedItem(null);
    }, 500);
  }, []);

  const handleSubmenuMouseEnter = useCallback(() => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
  }, []);

  const handleSubmenuMouseLeave = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
      setFocusedItem(null);
    }, 500);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, itemId: string, hasChildren: boolean) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          if (hasChildren) {
            e.preventDefault();
            setActiveDropdown(activeDropdown === itemId ? null : itemId);
            setFocusedItem(itemId);
          }
          break;
        case 'Escape':
          setActiveDropdown(null);
          setFocusedItem(null);
          break;
        case 'ArrowDown':
          if (hasChildren && activeDropdown !== itemId) {
            e.preventDefault();
            setActiveDropdown(itemId);
            setFocusedItem(itemId);
          }
          break;
      }
    },
    [activeDropdown]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setFocusedItem(null);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  if (!isClient) {
    return (
      <header className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50 h-16" role="banner">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={48}
                height={60}
                className="w-auto h-auto max-w-[44px] max-h-[44px]"
              />
              <div className="hidden md:block">
                <div className="text-[10px] lg:text-xs font-medium text-gray-600">
                  <span className="hidden lg:inline">
                    Samodzielny Publiczny Zakład Opieki Zdrowotnej
                  </span>
                  <span className="lg:hidden">SPZOZ</span>
                </div>
                <div className="text-xs lg:text-sm font-bold text-gray-900 leading-tight">
                  <span className="hidden lg:inline">Gminny Ośrodek Zdrowia w Łopusznie</span>
                  <span className="lg:hidden">GOZ Łopuszno</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      ref={menuRef}
      className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50"
      role="banner"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 lg:gap-3 text-xl font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-600 rounded-lg p-1.5 flex-shrink-0"
          >
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={48}
              height={60}
              className="w-auto h-auto max-w-[44px] max-h-[44px]"
            />
            <div className="hidden md:block">
              <div className="text-[10px] lg:text-xs text-gray-600 leading-tight">
                <span className="hidden xl:inline">
                  Samodzielny Publiczny Zakład Opieki Zdrowotnej
                </span>
                <span className="xl:hidden">SPZOZ</span>
              </div>
              <div className="text-xs lg:text-sm font-bold text-gray-900 leading-tight">
                <span className="hidden xl:inline">Gminny Ośrodek Zdrowia w Łopusznie</span>
                <span className="xl:hidden">GOZ Łopuszno</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden lg:block flex-shrink-0"
            role="navigation"
            aria-label="Nawigacja główna"
          >
            <ul className="flex items-center space-x-1 xl:space-x-2">
              {hierarchicalItems.map(item => {
                const hasChildren = item.children && item.children.length > 0;
                const isActive = pathname === item.url;
                const isDropdownOpen = activeDropdown === item.id;

                return (
                  <li
                    key={item.id}
                    className="relative menu-item"
                    onMouseEnter={() => hasChildren && handleMouseEnter(item.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {item.url ? (
                      <Link
                        href={item.url}
                        className={`
                                                    flex items-center gap-1 xl:gap-2 px-3 xl:px-4 py-3 rounded-lg font-medium text-sm
                                                    transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                                                    hover:bg-blue-50 hover:text-blue-700
                                                    ${isActive ? 'text-blue-700 bg-blue-50' : 'text-gray-700'}
                                                    ${isDropdownOpen ? 'bg-blue-50 text-blue-700' : ''}
                                                `}
                        onKeyDown={e => handleKeyDown(e, item.id, Boolean(hasChildren))}
                        aria-expanded={hasChildren ? isDropdownOpen : undefined}
                        aria-haspopup={hasChildren ? 'menu' : undefined}
                      >
                        <span>{item.title}</span>
                        {hasChildren && (
                          <ChevronDown
                            className={`
                                                            h-4 w-4 transition-transform duration-200 ease-in-out
                                                            ${isDropdownOpen ? 'rotate-180' : ''}
                                                        `}
                            aria-hidden="true"
                          />
                        )}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className={`
                                                    flex items-center gap-1 xl:gap-2 px-3 xl:px-4 py-3 rounded-lg font-medium text-sm w-full text-left
                                                    transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                                                    hover:bg-blue-50 hover:text-blue-700
                                                    ${isDropdownOpen ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                                                `}
                        onKeyDown={e => handleKeyDown(e, item.id, Boolean(hasChildren))}
                        onClick={() =>
                          hasChildren &&
                          setActiveDropdown(activeDropdown === item.id ? null : item.id)
                        }
                        aria-expanded={hasChildren ? isDropdownOpen : undefined}
                        aria-haspopup={hasChildren ? 'menu' : undefined}
                      >
                        <span>{item.title}</span>
                        {hasChildren && (
                          <ChevronDown
                            className={`
                                                            h-4 w-4 transition-transform duration-200 ease-in-out
                                                            ${isDropdownOpen ? 'rotate-180' : ''}
                                                        `}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    )}

                    {/* Dropdown Menu */}
                    {hasChildren && isDropdownOpen && (
                      <div
                        className="absolute top-full left-0 mt-1 z-50"
                        onMouseEnter={handleSubmenuMouseEnter}
                        onMouseLeave={handleSubmenuMouseLeave}
                      >
                        <div
                          ref={el => {
                            if (el) {
                              dropdownRefs.current.set(item.id, el);
                            }
                          }}
                          className="min-w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-quick-fade-in"
                          role="menu"
                          aria-label={`Podmenu dla ${item.title}`}
                        >
                          {/* Submenu items */}
                          {item.children?.map(child => {
                            const isChildActive = child.url && pathname === child.url;
                            return child.url ? (
                              <Link
                                key={child.id}
                                href={child.url}
                                className={`
                                                                    block px-4 py-3 text-sm font-medium transition-colors duration-150
                                                                    hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700
                                                                    ${isChildActive ? 'text-blue-700 bg-blue-50' : 'text-gray-700'}
                                                                `}
                                role="menuitem"
                              >
                                {child.title}
                              </Link>
                            ) : (
                              <span
                                key={child.id}
                                className="block px-4 py-3 text-sm font-medium text-gray-500"
                                role="menuitem"
                              >
                                {child.title}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden border-2 border-gray-300 focus:ring-4 focus:ring-blue-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Przełącz menu mobilne"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <AnimatedSection animation="slideInUp">
            <nav
              className="lg:hidden py-4 border-t-2 border-gray-200 max-h-[calc(100vh-4rem)] overflow-y-auto"
              role="navigation"
              aria-label="Nawigacja mobilna"
            >
              <ul className="space-y-2">
                {hierarchicalItems.map(item => (
                  <li key={item.id}>
                    <div>
                      {item.url ? (
                        <Link
                          href={item.url}
                          className={`flex items-center justify-between py-3 px-4 rounded-lg font-medium transition-all duration-300 border-2 border-transparent hover:border-blue-200 focus:ring-4 focus:ring-blue-600 ${
                            pathname === item.url
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          onClick={() => {
                            if (!item.children || item.children.length === 0) {
                              setMobileMenuOpen(false);
                            }
                          }}
                        >
                          <span>{item.title}</span>
                          {item.children && item.children.length > 0 && (
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 ${activeDropdown === item.id ? 'transform rotate-180' : ''}`}
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveDropdown(activeDropdown === item.id ? null : item.id);
                              }}
                            />
                          )}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={`flex items-center justify-between py-3 px-4 rounded-lg font-medium transition-all duration-300 border-2 border-transparent hover:border-blue-200 focus:ring-4 focus:ring-blue-600 w-full text-left text-gray-700 hover:text-blue-600 hover:bg-blue-50`}
                          onClick={() => {
                            if (item.children && item.children.length > 0) {
                              setActiveDropdown(activeDropdown === item.id ? null : item.id);
                            }
                          }}
                        >
                          <span>{item.title}</span>
                          {item.children && item.children.length > 0 && (
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 ${activeDropdown === item.id ? 'transform rotate-180' : ''}`}
                            />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Mobile Submenu */}
                    {item.children && item.children.length > 0 && activeDropdown === item.id && (
                      <ul className="ml-4 mt-2 space-y-1 border-l-2 border-blue-100 pl-2">
                        {item.children.map(child => (
                          <li key={child.id}>
                            {child.url ? (
                              <Link
                                href={child.url}
                                className="block py-2 px-4 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {child.title}
                              </Link>
                            ) : (
                              <span className="block py-2 px-4 text-sm text-gray-500 rounded-lg">
                                {child.title}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </AnimatedSection>
        )}
      </div>
    </header>
  );
}
