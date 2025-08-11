'use client';

import { useState } from 'react';
import { Shield, FileText, Users, Lock, Eye, Scale, AlertTriangle, Phone, Mail, MapPin } from 'lucide-react';

export default function PrivacyLegalPage() {
  const [activeTab, setActiveTab] = useState('privacy');

  const tabs = [
    { id: 'privacy', label: 'Privacy Policy', icon: Shield },
    { id: 'terms', label: 'Terms of Service', icon: FileText },
    { id: 'data', label: 'Data Protection', icon: Lock },
    { id: 'cookies', label: 'Cookie Policy', icon: Eye },
    { id: 'compliance', label: 'Compliance', icon: Scale },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-green-600 p-3 rounded-xl">
                <Scale className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Privacy & Legal</h1>
                <p className="text-gray-600 mt-1">Orchard Services - Machinery Management System</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: July 14, 2025
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal Documents</h3>
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-xl shadow-lg p-8">
              
              {/* Privacy Policy */}
              {activeTab === 'privacy' && (
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <Shield className="h-8 w-8 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Privacy Policy</h2>
                  </div>
                  
                  <div className="prose max-w-none">
                    <h3>1. Information We Collect</h3>
                    <p>At Orchard Services, we collect information necessary to provide our machinery management services:</p>
                    <ul>
                      <li><strong>Account Information:</strong> Name, email address, phone number, and organization details</li>
                      <li><strong>Machinery Data:</strong> Equipment details, service records, maintenance logs, and operational data</li>
                      <li><strong>Usage Information:</strong> System access logs, feature usage, and performance analytics</li>
                      <li><strong>Location Data:</strong> GPS coordinates for machinery tracking and service optimization</li>
                    </ul>

                    <h3>2. How We Use Your Information</h3>
                    <p>We use collected information to:</p>
                    <ul>
                      <li>Provide and maintain our machinery management services</li>
                      <li>Send maintenance alerts and service reminders</li>
                      <li>Generate operational reports and analytics</li>
                      <li>Improve our services and develop new features</li>
                      <li>Communicate important updates and notifications</li>
                    </ul>

                    <h3>3. Information Sharing</h3>
                    <p>We do not sell, trade, or rent your personal information. We may share information in these limited circumstances:</p>
                    <ul>
                      <li>With your explicit consent</li>
                      <li>To comply with legal obligations</li>
                      <li>To protect our rights and prevent fraud</li>
                      <li>With trusted service providers under strict confidentiality agreements</li>
                    </ul>

                    <h3>4. Data Security</h3>
                    <p>We implement industry-standard security measures including:</p>
                    <ul>
                      <li>SSL/TLS encryption for all data transmission</li>
                      <li>Secure database storage with regular backups</li>
                      <li>Multi-factor authentication for system access</li>
                      <li>Regular security audits and vulnerability assessments</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Terms of Service */}
              {activeTab === 'terms' && (
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <FileText className="h-8 w-8 text-green-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Terms of Service</h2>
                  </div>
                  
                  <div className="prose max-w-none">
                    <h3>1. Service Description</h3>
                    <p>Orchard Services provides a comprehensive machinery management platform that includes:</p>
                    <ul>
                      <li>Equipment registration and tracking</li>
                      <li>Maintenance scheduling and reminders</li>
                      <li>Pre-start check systems</li>
                      <li>Service history management</li>
                      <li>Operational reporting and analytics</li>
                    </ul>

                    <h3>2. User Responsibilities</h3>
                    <p>By using our service, you agree to:</p>
                    <ul>
                      <li>Provide accurate and up-to-date information</li>
                      <li>Maintain the security of your account credentials</li>
                      <li>Use the service in compliance with applicable laws</li>
                      <li>Report any security vulnerabilities or issues promptly</li>
                      <li>Respect intellectual property rights</li>
                    </ul>

                    <h3>3. Service Availability</h3>
                    <p>We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service. Planned maintenance will be communicated in advance.</p>

                    <h3>4. Limitation of Liability</h3>
                    <p>Our liability is limited to the extent permitted by law. We are not responsible for:</p>
                    <ul>
                      <li>Equipment failures or operational decisions based on our data</li>
                      <li>Third-party integrations or external service disruptions</li>
                      <li>Data loss due to user error or system failures beyond our control</li>
                    </ul>

                    <h3>5. Termination</h3>
                    <p>Either party may terminate the service with 30 days written notice. Upon termination, you may export your data within 60 days.</p>
                  </div>
                </div>
              )}

              {/* Data Protection */}
              {activeTab === 'data' && (
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <Lock className="h-8 w-8 text-purple-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Data Protection</h2>
                  </div>
                  
                  <div className="prose max-w-none">
                    <h3>1. Data Storage and Location</h3>
                    <p>Your data is stored securely in:</p>
                    <ul>
                      <li><strong>Primary:</strong> MongoDB Atlas cloud infrastructure (AWS)</li>
                      <li><strong>Backup:</strong> Automated daily backups with 30-day retention</li>
                      <li><strong>Location:</strong> Data centers in Australia and New Zealand</li>
                    </ul>

                    <h3>2. Data Retention</h3>
                    <p>We retain your data according to these schedules:</p>
                    <ul>
                      <li><strong>Active accounts:</strong> Data retained while account is active</li>
                      <li><strong>Inactive accounts:</strong> Data retained for 2 years after last login</li>
                      <li><strong>Service records:</strong> Maintained for 7 years for compliance</li>
                      <li><strong>Logs and analytics:</strong> Aggregated data retained for 1 year</li>
                    </ul>

                    <h3>3. Your Data Rights</h3>
                    <p>Under applicable privacy laws, you have the right to:</p>
                    <ul>
                      <li><strong>Access:</strong> Request a copy of your personal data</li>
                      <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                      <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
                      <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                      <li><strong>Restriction:</strong> Limit how we process your data</li>
                    </ul>

                    <h3>4. Data Breach Response</h3>
                    <p>In the event of a data breach, we will:</p>
                    <ul>
                      <li>Assess and contain the breach within 2 hours</li>
                      <li>Notify affected users within 72 hours</li>
                      <li>Report to relevant authorities as required by law</li>
                      <li>Provide regular updates on remediation efforts</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Cookie Policy */}
              {activeTab === 'cookies' && (
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <Eye className="h-8 w-8 text-orange-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Cookie Policy</h2>
                  </div>
                  
                  <div className="prose max-w-none">
                    <h3>1. What Are Cookies</h3>
                    <p>Cookies are small text files stored on your device that help us provide and improve our services.</p>

                    <h3>2. Types of Cookies We Use</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900">Essential Cookies</h4>
                        <p className="text-blue-700 text-sm">Required for basic site functionality, authentication, and security.</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-900">Functional Cookies</h4>
                        <p className="text-green-700 text-sm">Remember your preferences and settings to enhance your experience.</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-900">Analytics Cookies</h4>
                        <p className="text-purple-700 text-sm">Help us understand how you use our service to improve performance.</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-orange-900">Security Cookies</h4>
                        <p className="text-orange-700 text-sm">Protect against fraud and maintain system security.</p>
                      </div>
                    </div>

                    <h3>3. Managing Cookies</h3>
                    <p>You can control cookies through:</p>
                    <ul>
                      <li>Browser settings to block or delete cookies</li>
                      <li>Our cookie preference center (available in account settings)</li>
                      <li>Third-party opt-out mechanisms for analytics cookies</li>
                    </ul>

                    <p><strong>Note:</strong> Disabling essential cookies may affect site functionality.</p>
                  </div>
                </div>
              )}

              {/* Compliance */}
              {activeTab === 'compliance' && (
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <Scale className="h-8 w-8 text-red-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Compliance & Regulations</h2>
                  </div>
                  
                  <div className="prose max-w-none">
                    <h3>1. Regulatory Compliance</h3>
                    <p>Our service complies with relevant regulations including:</p>
                    <ul>
                      <li><strong>Privacy Act 2020 (New Zealand)</strong> - Personal information protection</li>
                      <li><strong>Australian Privacy Principles</strong> - Data handling standards</li>
                      <li><strong>ISO 27001</strong> - Information security management</li>
                      <li><strong>SOC 2 Type II</strong> - Security and availability controls</li>
                    </ul>

                    <h3>2. Industry Standards</h3>
                    <p>We adhere to industry best practices:</p>
                    <ul>
                      <li><strong>Equipment Safety:</strong> Compliance with AS/NZS safety standards</li>
                      <li><strong>Data Security:</strong> Following NIST cybersecurity framework</li>
                      <li><strong>Quality Management:</strong> ISO 9001 certified processes</li>
                    </ul>

                    <h3>3. Audit and Certification</h3>
                    <p>Regular third-party audits ensure ongoing compliance:</p>
                    <ul>
                      <li>Annual security assessments</li>
                      <li>Quarterly compliance reviews</li>
                      <li>Continuous monitoring and improvement</li>
                    </ul>

                    <h3>4. Reporting and Transparency</h3>
                    <p>We provide transparency through:</p>
                    <ul>
                      <li>Annual transparency reports</li>
                      <li>Regular compliance status updates</li>
                      <li>Open communication about any incidents</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="mt-12 border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Email</div>
                      <div className="text-sm text-gray-600">legal@orchardservices.co.nz</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">Phone</div>
                      <div className="text-sm text-gray-600">+64 3 123 4567</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-medium">Address</div>
                      <div className="text-sm text-gray-600">Patutahi, Gisborne, New Zealand</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Notice */}
              <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Important Notice</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                      This document is effective as of July 14, 2025. We may update these terms periodically. 
                      Users will be notified of significant changes via email and system notifications.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
