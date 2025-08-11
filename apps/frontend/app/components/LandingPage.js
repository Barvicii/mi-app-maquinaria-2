'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Shield, Users, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Brand Name - más grande y sin logo */}
            <div className="flex items-center">
              <span className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">Orchard Services</span>
            </div>
            
            {/* Navigation Links */}
            <div className="flex items-center space-x-6">
              <Link href="/login" className="text-white hover:text-green-400 font-medium transition-colors drop-shadow-md">
                Log In
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-green-600/80 backdrop-blur-sm px-4 py-2 text-white font-medium hover:bg-green-500/80 transition-colors shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero section */}
      <div 
        className="relative isolate overflow-hidden min-h-screen bg-gradient-to-br from-green-600 to-green-800"
        style={{
          backgroundImage: `url('/Imagen/tractor-orchard.jpg'), url('https://images.unsplash.com/photo-1586771107445-d3ca888129ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
        
        <div className="relative mx-auto max-w-7xl px-6 pt-32 pb-24 sm:pt-40 sm:pb-32 lg:px-8 lg:pt-48 lg:pb-40 flex items-center min-h-screen">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl drop-shadow-2xl">
              Simplified Machinery Management
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-100 max-w-2xl mx-auto drop-shadow-lg">
              Our platform provides a complete solution for managing your machinery fleet, 
              optimizing maintenance, and improving operational efficiency.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/register"
                className="rounded-md bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-colors backdrop-blur-sm border border-green-500"
              >
                Get Started
                <ArrowRight className="ml-2 -mr-1 h-5 w-5 inline-block" />
              </Link>
              <Link href="/login" className="text-base font-semibold leading-6 text-white hover:text-green-300 transition-colors drop-shadow-lg border border-white/30 px-4 py-2 rounded-md backdrop-blur-sm">
                Log in <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>      {/* Features section */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-green-600">Efficient Management</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to manage your machinery
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our platform integrates all the necessary tools for effective machinery management,
              from preventive maintenance to operator assignment in orchard and agricultural operations.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  Enhanced Safety
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Prestart checks, safety inspections, and incident logs all in one place.
                  Reduce risk and comply with safety regulations.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  Operator Management
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Assign operators to machines, verify certifications, and track operation time.
                  Improve productivity and accountability.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  Analytics and Reports
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Detailed reports on machine performance, operating costs, and maintenance.
                  Make decisions based on concrete data.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                  Preventive Maintenance
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Schedule and track preventive maintenance for your machinery.
                  Reduce downtime and extend the life of your assets.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>      {/* CTA section */}
      <div className="bg-green-600">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:flex lg:items-center lg:justify-between lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to start?
            <br />
            Try our platform today.
          </h2>
          <div className="mt-10 flex items-center gap-x-6 lg:mt-0 lg:flex-shrink-0">
            <Link
              href="/register"
              className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-green-600 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Get Started
            </Link>
            <Link href="/login" className="text-sm font-semibold leading-6 text-white">
              Log In <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
              <span className="text-white text-sm font-bold">🌳</span>
            </div>
            <span className="text-sm font-medium text-gray-300">
              © {new Date().getFullYear()} Orchard Services. All rights reserved.
            </span>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex items-center space-x-6">
              <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
                Contact
              </Link>
              <Link href="/privacy-legal" className="text-sm text-gray-400 hover:text-white transition-colors">
                Privacy & Legal
              </Link>
              <Link href="/news" className="text-sm text-gray-400 hover:text-white transition-colors">
                News
              </Link>
              <span className="text-xs text-gray-500">
                Version 2.0.0
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
