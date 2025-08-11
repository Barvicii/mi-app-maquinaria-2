'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { Fragment } from 'react';
import Link from 'next/link';
import { PERMISSIONS } from '@/config/roles';
import { Menu, Transition } from '@headlessui/react';
import { 
  User, 
  Settings, 
  LogOut, 
  Users, 
  CreditCard, 
  BarChart,
  Wrench,
  Tool,
  Shield,
  Bell,
  Scale
} from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function UserMenu() {
  const { can, user } = usePermissions();
  
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };
  
  return (
    <Menu as="div" className="relative ml-3">
      <div>
        <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          <span className="sr-only">Open user menu</span>
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {/* User info section */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-1">
              Role: {user?.role?.replace('_', ' ').toLowerCase() || 'User'}
            </p>
          </div>
          
          {/* Personal section */}
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/profile"
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex px-4 py-2 text-sm text-gray-700 w-full items-center`}
                >
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </Link>
              )}
            </Menu.Item>
            
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/notifications"
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex px-4 py-2 text-sm text-gray-700 w-full items-center`}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </Link>
              )}
            </Menu.Item>
          </div>
          
          {/* Admin Tools section */}
          {(can(PERMISSIONS.REPORT_VIEW) || 
            can(PERMISSIONS.ALERTS_VIEW) ||
            can(PERMISSIONS.USER_VIEW) || 
            can(PERMISSIONS.ADMIN_SETTINGS)) && (
            <div className="py-1 border-t border-gray-100">
            
              
            
              
              {can(PERMISSIONS.ALERTS_VIEW) && (
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/alerts"
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex px-4 py-2 text-sm text-gray-700 w-full items-center`}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Alerts
                    </Link>
                  )}
                </Menu.Item>
              )}
              
              {can(PERMISSIONS.USER_VIEW) && (
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/users"
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex px-4 py-2 text-sm text-gray-700 w-full items-center`}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Users
                    </Link>
                  )}
                </Menu.Item>
              )}
              
              {can(PERMISSIONS.ADMIN_SETTINGS) && (
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/settings"
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex px-4 py-2 text-sm text-gray-700 w-full items-center`}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  )}
                </Menu.Item>
              )}
            </div>
          )}
          
          {/* System section */}
          <div className="py-1 border-t border-gray-100">
            {can(PERMISSIONS.ADMIN_SETTINGS) && (
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/system"
                    className={`${
                      active ? 'bg-gray-100' : ''
                    } flex px-4 py-2 text-sm text-gray-700 w-full items-center`}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    System
                  </Link>
                )}
              </Menu.Item>
            )}
            
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/privacy-legal"
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex px-4 py-2 text-sm text-gray-700 w-full items-center`}
                >
                  <Scale className="mr-2 h-4 w-4" />
                  Privacy & Legal
                </Link>
              )}
            </Menu.Item>
            
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleSignOut}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex px-4 py-2 text-sm text-gray-700 w-full items-center`}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
