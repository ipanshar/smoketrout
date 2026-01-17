import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield,
  Users,
  Settings,
  UserCircle,
  Wallet,
  ArrowRightLeft,
  ChefHat,
  Factory,
  LogOut,
  Menu,
  X,
  Database,
  Package,
  Warehouse,
  Building2,
  Ruler,
  Tags,
  Coins,
  UsersRound,
  ChevronDown,
  ChevronRight,
  Boxes,
  PiggyBank,
  Banknote,
  Briefcase,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

interface NavSection {
  title: string;
  module: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: 'Администрирование',
    module: 'admin',
    items: [
      { name: 'Роли', href: '/admin/roles', icon: Shield, permission: 'admin.roles.view' },
      { name: 'Пользователи', href: '/admin/users', icon: Users, permission: 'admin.users.view' },
      { name: 'Настройки', href: '/admin/settings', icon: Settings, permission: 'admin.settings.view' },
    ],
  },
  {
    title: 'Справочники',
    module: 'references',
    items: [
      { name: 'Контрагенты', href: '/references/counterparties', icon: Building2, permission: 'references.counterparties.view' },
      { name: 'Типы контрагентов', href: '/references/counterparty-types', icon: Tags, permission: 'references.counterparty_types.view' },
      { name: 'Склады', href: '/references/warehouses', icon: Warehouse, permission: 'references.warehouses.view' },
      { name: 'Кассы', href: '/references/cash-registers', icon: Wallet, permission: 'references.cash_registers.view' },
      { name: 'Валюты', href: '/references/currencies', icon: Coins, permission: 'references.currencies.view' },
      { name: 'Компаньоны', href: '/references/partners', icon: UsersRound, permission: 'references.partners.view' },
      { name: 'Товары', href: '/references/products', icon: Package, permission: 'references.products.view' },
      { name: 'Типы товаров', href: '/references/product-types', icon: Database, permission: 'references.product_types.view' },
      { name: 'Услуги', href: '/references/services', icon: Briefcase, permission: 'references.services.view' },
      { name: 'Единицы измерения', href: '/references/units', icon: Ruler, permission: 'references.units.view' },
    ],
  },
  {
    title: 'Бухгалтерия',
    module: 'accounting',
    items: [
      { name: 'Движения', href: '/accounting/transactions', icon: ArrowRightLeft, permission: 'accounting.transactions.view' },
      { name: 'Касса', href: '/accounting/cash', icon: Wallet, permission: 'accounting.cash.view' },
      { name: 'Склад', href: '/accounting/stock', icon: Boxes, permission: 'accounting.stock.view' },
      { name: 'Контрагенты', href: '/accounting/counterparties', icon: UserCircle, permission: 'accounting.counterparties.view' },
      { name: 'Дивиденды', href: '/accounting/dividends', icon: PiggyBank, permission: 'accounting.dividends.view' },
      { name: 'Зарплата', href: '/accounting/salary', icon: Banknote, permission: 'accounting.salary.view' },
    ],
  },
  {
    title: 'Производство',
    module: 'production',
    items: [
      { name: 'Рецепты', href: '/production/recipes', icon: ChefHat, permission: 'production.recipes.view' },
      { name: 'Производство', href: '/production/productions', icon: Factory, permission: 'production.production.view' },
    ],
  },
  {
    title: 'Личный кабинет',
    module: 'profile',
    items: [
      { name: 'Настройки аккаунта', href: '/profile/settings', icon: Settings, permission: 'profile.settings.view' },
    ],
  },
];

export default function MainLayout() {
  const { user, logout, hasPermission, hasModuleAccess } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    // По умолчанию все разделы свёрнуты
    const initial: Record<string, boolean> = {};
    navigation.forEach((section) => {
      initial[section.module] = true;
    });
    return initial;
  });

  const toggleSection = (module: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [module]: !prev[module],
    }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredNavigation = navigation
    .filter((section) => hasModuleAccess(section.module))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || hasPermission(item.permission)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-bg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
            <Link to="/" className="text-xl font-bold text-white hover:text-gray-200 transition-colors">
              🐟 Smoketrout
            </Link>
            <button
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {filteredNavigation.map((section) => {
              const isCollapsed = collapsedSections[section.module];
              return (
                <div key={section.title} className="mb-2">
                  <button
                    onClick={() => toggleSection(section.module)}
                    className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors rounded-lg hover:bg-sidebar-hover"
                  >
                    <span>{section.title}</span>
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <div
                    className={clsx(
                      'overflow-hidden transition-all duration-200',
                      isCollapsed ? 'max-h-0' : 'max-h-[1000px]'
                    )}
                  >
                    <ul className="space-y-1 mt-1">
                      {section.items.map((item) => (
                        <li key={item.href}>
                          <NavLink
                            to={item.href}
                            className={({ isActive }) =>
                              clsx('sidebar-link', isActive && 'active')
                            }
                            onClick={() => setSidebarOpen(false)}
                          >
                            <item.icon className="w-5 h-5" />
                            <span>{item.name}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.role?.display_name || 'Без роли'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-gray-300 hover:bg-sidebar-hover hover:text-white rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6">
          <button
            className="lg:hidden text-gray-600 hover:text-gray-900 mr-4"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
