'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Wrench, Clipboard, Bell, Settings, QrCode, Users, User, LogOut } from 'lucide-react';

const NavBar = ({ activeTab, onTabChange }) => {
  const { data: session } = useSession();

  return (
    <nav className="navigation-container">
      <button
        className={`nav-button ${activeTab === 'machines' ? 'nav-button-active' : 'nav-button-inactive'}`}
        onClick={() => onTabChange('machines')}
      >
        <Wrench className="nav-icon" />
        <span>Machines</span>
      </button>
      <button
        className={`nav-button ${activeTab === 'prestart' ? 'nav-button-active' : 'nav-button-inactive'}`}
        onClick={() => onTabChange('prestart')}
      >
        <Clipboard className="nav-icon" />
        <span>Pre-Start</span>
      </button>
      <button
        className={`nav-button ${activeTab === 'services' ? 'nav-button-active' : 'nav-button-inactive'}`}
        onClick={() => onTabChange('services')}
      >
        <Settings className="nav-icon" />
        <span>Services</span>
      </button>
      <button
        className={`nav-button ${activeTab === 'alertas' ? 'nav-button-active' : 'nav-button-inactive'}`}
        onClick={() => onTabChange('alertas')}
      >
        <Bell className="nav-icon" />
        <span>Alerts</span>
      </button>
      <button
        className={`nav-button ${activeTab === 'qr' ? 'nav-button-active' : 'nav-button-inactive'}`}
        onClick={() => onTabChange('qr')}
      >
        <QrCode className="nav-icon" />
        <span>QR</span>
      </button>
      <button
        className={`nav-button ${activeTab === 'operators' ? 'nav-button-active' : 'nav-button-inactive'}`}
        onClick={() => onTabChange('operators')}
      >
        <Users className="nav-icon" />
        <span>Operators</span>
      </button>
      
      {/* User menu buttons */}
      {session && (
        <div className="ml-auto flex items-center space-x-2">
          <Link 
            href="/profile" 
            className="nav-button nav-button-inactive flex items-center"
          >
            <User className="nav-icon" />
            <span className="hidden md:inline">Profile</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="nav-button nav-button-inactive flex items-center"
          >
            <LogOut className="nav-icon" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default NavBar;