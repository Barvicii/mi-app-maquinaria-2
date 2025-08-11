import React from 'react';
import { NavLink } from 'react-router-dom';
import { User } from 'react-feather';

const Sidebar = () => {
  const navigation = [
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      children: [
        { name: 'Personal Info', href: '/profile' },
        // Comentar o remover billing
        // { name: 'Billing', href: '/profile/billing' },
        { name: 'Security', href: '/profile/security' },
      ]
    },
    // ...existing code...
  ];

  return (
    <div>
      {/* ...existing sidebar code... */}
      <nav>
        {navigation.map((item) => (
          <div key={item.name}>
            <NavLink to={item.href}>
              <item.icon />
              {item.name}
            </NavLink>
            {item.children && (
              <div>
                {item.children.map((child) => (
                  <NavLink key={child.name} to={child.href}>
                    {child.name}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      {/* ...existing code... */}
    </div>
  );
};

export default Sidebar;