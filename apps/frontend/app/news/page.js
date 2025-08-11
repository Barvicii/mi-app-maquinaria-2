'use client';

import { useState } from 'react';
import { Calendar, User, ArrowRight, Tag, Newspaper } from 'lucide-react';

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const newsArticles = [
    {
      id: 1,
      title: "New Pre-Start Check Features Released",
      excerpt: "Enhanced QR code functionality and improved mobile experience for machinery pre-start checks.",
      content: "We've released major improvements to our pre-start check system, including enhanced QR code scanning, offline capability, and a redesigned mobile interface for better usability in the field.",
      date: "2025-07-14",
      author: "Orchard Services Team",
      category: "product",
      featured: true
    },
    {
      id: 2,
      title: "Partnership with Leading Equipment Manufacturers",
      excerpt: "Orchard Services announces partnerships with major machinery manufacturers for improved integration.",
      content: "We're excited to announce new partnerships with leading equipment manufacturers, enabling direct integration of machine data and automated maintenance scheduling.",
      date: "2025-07-10",
      author: "Business Development",
      category: "partnership"
    },
    {
      id: 3,
      title: "Enhanced Security and Compliance Features",
      excerpt: "New security measures and compliance tools to meet industry standards and protect your data.",
      content: "Our latest update includes advanced security features, audit trails, and compliance tools designed to meet stringent industry requirements and protect your valuable operational data.",
      date: "2025-07-05",
      author: "Security Team",
      category: "security"
    },
    {
      id: 4,
      title: "Agricultural Technology Conference 2025",
      excerpt: "Orchard Services to present at the upcoming AgTech Conference in Auckland.",
      content: "Join us at the Agricultural Technology Conference 2025 where we'll be presenting our latest innovations in machinery management and demonstrating our new AI-powered maintenance prediction features.",
      date: "2025-06-28",
      author: "Marketing Team",
      category: "event"
    },
    {
      id: 5,
      title: "Customer Success: 50% Reduction in Downtime",
      excerpt: "Case study: How Patterson Orchards reduced machinery downtime by 50% using our platform.",
      content: "Discover how Patterson Orchards transformed their operations, reducing machinery downtime by 50% and improving overall efficiency through strategic use of our maintenance scheduling and alert systems.",
      date: "2025-06-20",
      author: "Customer Success",
      category: "case-study"
    },
    {
      id: 6,
      title: "Mobile App Beta Testing Program",
      excerpt: "Join our beta testing program for the new Orchard Services mobile application.",
      content: "We're looking for beta testers for our upcoming mobile app. Get early access to new features and help shape the future of mobile machinery management.",
      date: "2025-06-15",
      author: "Product Team",
      category: "product"
    }
  ];

  const categories = [
    { id: 'all', name: 'All News' },
    { id: 'product', name: 'Product Updates' },
    { id: 'partnership', name: 'Partnerships' },
    { id: 'security', name: 'Security' },
    { id: 'event', name: 'Events' },
    { id: 'case-study', name: 'Case Studies' }
  ];

  const filteredArticles = selectedCategory === 'all' 
    ? newsArticles 
    : newsArticles.filter(article => article.category === selectedCategory);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NZ', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-600 to-green-600 p-3 rounded-xl">
              <Newspaper className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">News & Updates</h1>
              <p className="text-gray-600 mt-1">Stay informed about the latest developments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Category Filter */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Article */}
        {selectedCategory === 'all' && (
          <div className="mb-12">
            {newsArticles.filter(article => article.featured).map((article) => (
              <div key={article.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-4">
                  <span className="text-white text-sm font-medium">Featured Story</span>
                </div>
                <div className="p-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Tag className="h-3 w-3 mr-1" />
                      {categories.find(cat => cat.id === article.category)?.name}
                    </span>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(article.date)}
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <User className="h-4 w-4 mr-1" />
                      {article.author}
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{article.title}</h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">{article.content}</p>
                  <button className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                    Read more
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.filter(article => !article.featured || selectedCategory !== 'all').map((article) => (
            <div key={article.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <Tag className="h-3 w-3 mr-1" />
                    {categories.find(cat => cat.id === article.category)?.name}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                  {article.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {article.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(article.date)}
                    </div>
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {article.author}
                    </div>
                  </div>
                  
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                    Read
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Stay Updated</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Subscribe to our newsletter to receive the latest news, product updates, and industry insights directly in your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              />
              <button className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
