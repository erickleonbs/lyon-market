'use client';

import { OrganizationCard } from '@/components/OrganizationCard';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';
import { LoginModal } from '@/components/LoginModal';
import { useState } from 'react';

// Mock Data for MVP
const MOCK_ORGS = [
  {
    id: '1',
    name: 'Barbería Bros',
    category: 'Services',
    imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop',
    rating: 4.8,
    location: 'Roma Norte, CDMX'
  },
  {
    id: '2',
    name: 'Boutique Luna',
    category: 'Fashion',
    imageUrl: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=2070&auto=format&fit=crop',
    rating: 4.9,
    location: 'Polanco, CDMX'
  },
  {
    id: '3',
    name: 'Tech Haven',
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=2001&auto=format&fit=crop',
    rating: 4.5,
    location: 'Condesa, CDMX'
  },
  {
    id: '4',
    name: 'Studio Zen',
    category: 'Wellness',
    imageUrl: 'https://images.unsplash.com/photo-1599447475569-455b8026197b?q=80&w=2070&auto=format&fit=crop',
    rating: 5.0,
    location: 'Juárez, CDMX'
  },
  {
    id: '5',
    name: 'Sneaker Head',
    category: 'Fashion',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop',
    rating: 4.7,
    location: 'Coyoacán, CDMX'
  },
  {
    id: '6',
    name: 'Vintage Finds',
    category: 'Antiques',
    imageUrl: 'https://images.unsplash.com/photo-1552554766-3d717088484a?q=80&w=1932&auto=format&fit=crop',
    rating: 4.6,
    location: 'Centro, CDMX'
  }
];

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans text-zinc-900 dark:text-zinc-100">

      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <div className="font-black text-2xl tracking-tighter flex-shrink-0">
            LILFY<span className="text-purple-600">.</span>MARKET
          </div>

          {/* Search Bar - Hidden on small mobile */}
          <div className="hidden md:flex flex-1 max-w-md relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-purple-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Buscar servicios, tiendas, productos..."
              className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-purple-500/50 transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 cursor-pointer" />
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="text-sm font-bold hover:text-purple-600 transition-colors"
              >
                Iniciar Sesión
              </button>
            )}
            <button className="md:hidden p-2 text-zinc-600 dark:text-zinc-400">
              <Search size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        {/* Location / Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 text-purple-600 font-bold bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-full w-fit">
            <MapPin size={18} />
            <span>CDMX, México</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {['Todo', 'Fashion', 'Services', 'Food', 'Electronics', 'Wellness'].map((cat, i) => (
              <button
                key={cat}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${i === 0 ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'}`}
              >
                {cat}
              </button>
            ))}
            <button className="px-3 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {MOCK_ORGS.map(org => (
            <OrganizationCard key={org.id} {...org} />
          ))}
        </div>

      </main>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={() => { setIsLoggedIn(true); setShowLogin(false); }}
      />
    </div>
  );
}
