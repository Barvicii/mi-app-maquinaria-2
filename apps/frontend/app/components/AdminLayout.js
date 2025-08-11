import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="text-xl font-bold">Admin Dashboard</div>
            <ul className="flex space-x-6">
              <li>
                <Link href="/dashboard" className={pathname === '/dashboard' ? 'text-blue-500' : 'text-gray-600 hover:text-gray-900'}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/machines" className={pathname === '/machines' ? 'text-blue-500' : 'text-gray-600 hover:text-gray-900'}>
                  Machines
                </Link>
              </li>
              <li>
                <Link href="/admin/prestart-templates" className={pathname === '/admin/prestart-templates' ? 'text-blue-500' : 'text-gray-600 hover:text-gray-900'}>
                  PreStart Templates
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}