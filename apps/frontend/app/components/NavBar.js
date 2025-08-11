'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  UserPlus, Database, FileText, AlertTriangle, QrCode, 
  Users, BarChart2, FilePlus, ClipboardCheck, Settings,
  User, LogOut, UserCog, Building2
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

const NavBar = ({ activeTab, onTabChange, isSuperAdmin = false, isAdmin = false }) => {
  const { data: session } = useSession();
  const [showSettings, setShowSettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const settingsRef = useRef(null);
  const userMenuRef = useRef(null);
  
  // Define main tabs that are always shown
  const mainTabs = [
    { id: 'dashboard', name: 'Dashboard', icon: <BarChart2 size={18} /> },
    { id: 'machines', name: 'Machinery', icon: <Database size={18} /> },
    { id: 'prestart', name: 'Pre-Start', icon: <ClipboardCheck size={18} /> },
    { id: 'services', name: 'Services', icon: <FileText size={18} /> },
    { id: 'reports', name: 'Reports', icon: <FilePlus size={18} /> },
  ];
  
  // Define tabs that will go in the settings menu
  const settingsTabs = [
    { id: 'diesel', name: 'Diesel' },
    { id: 'alertas', name: 'Alerts' },
    { id: 'qr', name: 'QR Codes' },
    { id: 'operators', name: 'Operators' },
    { id: 'prestart-templates', name: 'Pre-Start Templates' },
  ];
  
  // Add organizations tab for super admin only
  if (isSuperAdmin) {
    settingsTabs.unshift({ id: 'organizations', name: 'Organizations' });
  }
  
  // Add admin-specific tabs
  if (isAdmin || isSuperAdmin) {
    settingsTabs.push({ id: 'users', name: 'Users' });
    // settingsTabs.push({ id: 'admin-reports', name: 'Reportes Organizacionales' }); // Eliminado por solicitud
  }
  
  // Close menus when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle tab selection
  const handleTabClick = (tabId) => {
    onTabChange(tabId);
    if (settingsTabs.some(tab => tab.id === tabId)) {
      setShowSettings(false);
    }
  };
  
  // Check if active tab is in settings menu
  const isSettingsTabActive = settingsTabs.some(tab => tab.id === activeTab);

  // Handle logout
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Get user initials
  const getUserInitials = () => {
    if (!session || !session.user) return 'U';
    if (session.user.name) {
      const names = session.user.name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return session.user.name[0].toUpperCase();
    }
    if (session.user.email) {
      return session.user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <nav className="app-nav">
      {/* Main tabs - Horizontal menu */}
      {mainTabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => handleTabClick(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-text">{tab.name}</span>
        </button>
      ))}
      
      <div className="flex-grow"></div>
      
      {/* Settings menu */}
      <div className="settings-dropdown-container" ref={settingsRef}>
        <button
          className={`nav-tab ${isSettingsTabActive ? 'active' : ''}`}
          onClick={() => setShowSettings(!showSettings)}
        >
          <span className="nav-icon"><Settings size={18} /></span>
          <span className="nav-text">Config</span>
        </button>
        
        {/* Vertical dropdown menu */}
        {showSettings && (
          <div className="vertical-dropdown">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                className={`vertical-dropdown-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
              >
                {tab.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* User icon - Shows initials and leads to user menu */}
      <div className="user-dropdown-container ml-2" ref={userMenuRef}>
        <button
          className="user-avatar"
          onClick={() => setShowUserMenu(!showUserMenu)}
          aria-label="User menu"
        >
          {getUserInitials()}
        </button>
        
        {/* User dropdown menu */}
        {showUserMenu && (
          <div className="user-dropdown">
            <div className="user-info">
              <p className="user-name">{session?.user?.name || 'User'}</p>
              <p className="user-email">{session?.user?.email}</p>
              <p className="user-role">{session?.user?.role || 'Standard User'}</p>
            </div>
            <div className="user-dropdown-divider"></div>
            
            <Link href="/profile" className="user-dropdown-item">
              <User size={16} className="mr-2" />
              My Profile
            </Link>
            
            <button onClick={handleLogout} className="user-dropdown-item text-red-600">
              <LogOut size={16} className="mr-2" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;