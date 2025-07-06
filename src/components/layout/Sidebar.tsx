
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  LineChart, 
  Menu, 
  X, 
  ChevronRight,
  PiggyBank,
  Map,
  Building,
  ArrowLeft,
  FileText,
  Calculator
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinance } from '@/context/FinanceContext';

// Define the menu item type
interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  subItems?: Array<{
    name: string;
    path: string;
  }>;
}

const getBaseMenuItems = (currentAreaId?: string): MenuItem[] => [
  {
    name: 'Dashboard',
    path: '/',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    name: 'Customers',
    path: '/customers',
    icon: <Users className="w-5 h-5" />,
  },
  {
    name: 'Collections',
    path: '/collections',
    icon: <PiggyBank className="w-5 h-5" />,
    subItems: [
      {
        name: 'Daily',
        path: '/collections/daily',
      },
      {
        name: 'Weekly',
        path: '/collections/weekly',
      },
      {
        name: 'Monthly',
        path: '/collections/monthly',
      },
    ],
  },
  {
    name: 'Posting',
    path: '/posting',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    name: 'Balance Sheet',
    path: '/balance-sheet',
    icon: <LineChart className="w-5 h-5" />,
  },
  {
    name: 'Reports',
    path: currentAreaId ? `/areas/${currentAreaId}/reports` : '/reports',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    name: 'Calculator',
    path: '/calculator',
    icon: <Calculator className="w-5 h-5" />,
  },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { areas, currentAreaId, setCurrentArea, getAreaById } = useFinance();
  
  const currentArea = currentAreaId ? getAreaById(currentAreaId) : null;
  
  // Base menu items
  const menuItems: MenuItem[] = [
    {
      name: 'Line',
      path: '/areas',
      icon: <Map className="w-5 h-5" />,
    },
    ...getBaseMenuItems(currentAreaId)
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleSubmenu = (path: string) => {
    if (openSubmenu === path) {
      setOpenSubmenu(null);
    } else {
      setOpenSubmenu(path);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };
  
  const handleExitArea = () => {
    setCurrentArea(null);
    navigate('/areas');
  };

  return (
    <>
      {/* Mobile menu button */}
      <button 
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden bg-card text-card-foreground rounded-md p-2 shadow-soft"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 h-full bg-sidebar text-sidebar-foreground shadow-card w-64 z-50 transition-transform duration-300 ease-in-out transform",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-lg font-semibold text-finance-text-primary">Line Manager</h1>
          <button onClick={toggleSidebar} className="lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {currentArea && (
          <div className="px-4 py-3 border-b bg-finance-blue-light">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-finance-text-secondary">Current Area</p>
                <p className="font-medium text-finance-blue">{currentArea.name}</p>
              </div>
              <button 
                onClick={handleExitArea}
                className="text-finance-blue hover:text-finance-blue/80 p-1 rounded-full hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <nav className="p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                {item.subItems ? (
                  <div className="mb-1">
                    <button
                      onClick={() => toggleSubmenu(item.path)}
                      className={cn(
                        "flex items-center justify-between w-full p-2 rounded-md transition-colors",
                        isActive(item.path)
                          ? "bg-finance-blue-light text-finance-blue"
                          : "hover:bg-finance-gray text-finance-text-secondary hover:text-finance-text-primary"
                      )}
                    >
                      <div className="flex items-center">
                        {item.icon}
                        <span className="ml-3 font-medium">{item.name}</span>
                      </div>
                      <ChevronRight
                        className={cn(
                          "w-4 h-4 transition-transform",
                          openSubmenu === item.path && "transform rotate-90"
                        )}
                      />
                    </button>
                    {openSubmenu === item.path && item.subItems && (
                      <ul className="mt-1 ml-6 space-y-1 animate-fade-in">
                        {item.subItems.map((subItem) => (
                          <li key={subItem.path}>
                            <Link
                              to={subItem.path}
                              className={cn(
                                "block p-2 rounded-md transition-colors",
                                isActive(subItem.path)
                                  ? "bg-finance-blue-light text-finance-blue"
                                  : "hover:bg-finance-gray text-finance-text-secondary hover:text-finance-text-primary"
                              )}
                              onClick={() => setIsOpen(false)}
                            >
                              {subItem.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center p-2 rounded-md transition-colors",
                      isActive(item.path)
                        ? "bg-finance-blue-light text-finance-blue"
                        : "hover:bg-finance-gray text-finance-text-secondary hover:text-finance-text-primary"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.icon}
                    <span className="ml-3 font-medium">{item.name}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
