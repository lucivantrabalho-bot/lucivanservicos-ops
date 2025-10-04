import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Home,
  Plus,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Shield
} from 'lucide-react';

export default function MobileNavigation() {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    {
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      show: true
    },
    {
      label: 'Nova Pendência',
      icon: Plus,
      path: '/create',
      show: true,
      highlight: true
    },
    {
      label: 'Admin Panel',
      icon: Shield,
      path: '/admin',
      show: isAdmin,
      badge: 'Admin'
    },
    {
      label: 'Perfil',
      icon: User,
      path: '/profile',
      show: true
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-40 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2M12 4.5L19.5 8.5V10C19.5 15 16.5 18.5 12 20C7.5 18.5 4.5 15 4.5 10V8.5L12 4.5M7 14L9 16L17 8L15.59 6.59L9 13.17L8.41 12.59L7 14Z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">CN19</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Olá, {user?.username}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
          <div className="fixed inset-y-0 right-0 w-64 bg-white dark:bg-gray-900 shadow-xl border-l border-gray-200 dark:border-gray-700">
            {/* Menu Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {user?.username}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isAdmin ? 'Administrador' : 'Usuário'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2 space-y-1">
              {navigationItems
                .filter(item => item.show)
                .map((item, index) => {
                  const Icon = item.icon;
                  const isCurrent = isCurrentPath(item.path);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                        isCurrent 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-l-4 border-emerald-500' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      } ${item.highlight ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700' : ''}`}
                    >
                      <Icon className={`w-5 h-5 ${isCurrent ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                      <span className="font-medium flex-1">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                      {item.highlight && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
            </div>

            {/* Menu Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair da Conta
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-2 py-2 z-30 backdrop-blur-lg bg-white/90 dark:bg-gray-900/90">
        <div className="flex justify-around">
          {navigationItems
            .filter(item => item.show)
            .slice(0, 4) // Only show first 4 items in bottom nav
            .map((item, index) => {
              const Icon = item.icon;
              const isCurrent = isCurrentPath(item.path);
              
              return (
                <button
                  key={index}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                    isCurrent 
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-6 h-6" />
                    {item.highlight && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                    {item.badge && (
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium truncate w-full text-center">
                    {item.label}
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    </>
  );
}