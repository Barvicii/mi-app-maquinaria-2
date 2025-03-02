'use client';

import React from 'react';
import { Wrench, Clipboard, Bell, Settings, QrCode, Users } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import UserMenu from './UserMenu';

const NavBar = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'machines', label: 'Machines', Icon: Wrench },
    { id: 'prestart', label: 'Pre-Start', Icon: Clipboard },
    { id: 'services', label: 'Services', Icon: Settings },
    { id: 'alertas', label: 'Alerts', Icon: Bell },
    { id: 'qr', label: 'QR', Icon: QrCode },
    { id: 'operators', label: 'Operators', Icon: Users },
  ];

  return (
    <div className="nav-and-user-container">
      <nav className="navigation-container">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-button ${
              activeTab === id ? 'nav-button-active' : 'nav-button-inactive'
            }`}
            onClick={() => onTabChange(id)}
          >
            <Icon className="nav-icon" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <UserMenu />
    </div>
  );
};

export default NavBar;