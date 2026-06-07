'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Star, Sparkles, Filter, Info } from 'lucide-react';
import { useState, use } from 'react';
import { MirrorCamera } from '@/components/MirrorCamera';
import { LoginModal } from '@/components/LoginModal';

// Mock Data
const ORG_DETAILS = {
    '1': { name: 'Barbería Bros', image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop', category: 'Services', description: 'Cortes clásicos y modernos con el mejor ambiente.' },
    '2': { name: 'Boutique Luna', image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=2070&auto=format&fit=crop', category: 'Fashion', description: 'Moda sustentable y diseños exclusivos.' },
    // Fallback for others
};

const PRODUCTS = [
    { id: 'p1', name: 'Oversized Trench Coat', price: 129.00, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=2072&auto=format&fit=crop', tryOn: true },
    { id: 'p2', name: 'Classic Denim Jacket', price: 89.00, image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab5?q=80&w=1974&auto=format&fit=crop', tryOn: false },
    { id: 'p3', name: 'Summer Floral Dress', price: 65.00, image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=2046&auto=format&fit=crop', tryOn: true },
    { id: 'p4', name: 'Urban Hoodie', price: 55.00, image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=2070&auto=format&fit=crop', tryOn: false },
];

export default function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    // @ts-ignore
    const org = ORG_DETAILS[id] || { name: 'Organization Name', image: 'https://via.placeholder.com/800', category: 'General', description: 'Detailed description of the services offered by this organization.' };

    const [showMirror, setShowMirror] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    const handleTryOn = (product: any) => {
        setSelectedProduct(product);
        if (isLoggedIn) {
            setShowMirror(true);
        } else {
            setShowLogin(true);
        }
    };

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
        setShowLogin(false);
        setShowMirror(true);
    };

    const handleCapture = (imageData: string) => {
        setCapturedImage(imageData);
        setShowMirror(false);
        // Logic to show result
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black font-sans text-zinc-900 dark:text-zinc-100">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div className="font-bold text-lg">{org.name}</div>
            </nav>

            {/* Hero */}
            <div className="pt-16 pb-6">
                <div className="w-full h-48 md:h-64 relative bg-zinc-200 dark:bg-zinc-800">
                    <img src={org.image} className="w-full h-full object-cover opacity-80" alt="Cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6 text-white">
                        <div className="flex items-center gap-2 text-sm font-medium mb-1 opacity-80">
                            <span className="uppercase tracking-wider">{org.category}</span>
                            <span>•</span>
                            <div className="flex items-center gap-0.5">
                                <Star size={14} className="fill-yellow-400 text-yellow-400" /> 4.9
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight">{org.name}</h1>
                        <div className="flex items-center gap-1.5 mt-2 text-sm opacity-90">
                            <MapPin size={16} />
                            <span>Roma Norte, CDMX</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
                {/* Tabs / Filters */}
                <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800 mb-8 overflow-x-auto">
                    <button className="pb-3 border-b-2 border-black dark:border-white font-bold whitespace-nowrap">Productos</button>
                    <button className="pb-3 border-b-2 border-transparent text-zinc-500 hover:text-black transition-colors whitespace-nowrap">Servicios</button>
                    <button className="pb-3 border-b-2 border-transparent text-zinc-500 hover:text-black transition-colors whitespace-nowrap">Información</button>
                </div>

                {/* Result of Try On */}
                {capturedImage && (
                    <div className="mb-12 p-6 bg-purple-50 dark:bg-purple-900/10 rounded-3xl border border-purple-100 dark:border-purple-900/30 flex flex-col md:flex-row gap-8 items-center animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-full md:w-1/3 aspect-[3/4] rounded-2xl overflow-hidden shadow-xl bg-black relative">
                            <img src={capturedImage} className="w-full h-full object-cover" alt="Result" />
                            <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                Try On Result
                            </div>
                        </div>
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <h3 className="text-2xl font-bold">¡Te ves genial! ✨</h3>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Así se te vería el <span className="font-bold text-black dark:text-white">{selectedProduct?.name}</span>.
                                La IA ha ajustado la prenda a tu postura.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <button className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-full font-bold hover:opacity-90 transition-opacity">
                                    Agregar al Carrito
                                </button>
                                <button
                                    onClick={() => setShowMirror(true)}
                                    className="border border-zinc-300 dark:border-zinc-700 px-6 py-3 rounded-full font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Probar otra vez
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Product Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                    {PRODUCTS.map(product => (
                        <div key={product.id} className="group cursor-pointer">
                            <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden relative mb-3">
                                <img src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={product.name} />
                                {product.tryOn && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleTryOn(product); }}
                                        className="absolute bottom-3 right-3 bg-white/90 dark:bg-black/90 backdrop-blur-md p-2 rounded-full text-purple-600 shadow-lg hover:scale-110 hover:bg-purple-600 hover:text-white transition-all z-10"
                                        title="Probar con IA"
                                    >
                                        <Sparkles size={18} />
                                    </button>
                                )}
                            </div>
                            <h3 className="font-medium text-sm md:text-base leading-tight mb-1">{product.name}</h3>
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-lg">${product.price}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <LoginModal
                isOpen={showLogin}
                onClose={() => setShowLogin(false)}
                onLoginSuccess={handleLoginSuccess}
            />

            {showMirror && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
                    <div className="w-full max-w-lg aspect-[3/4] relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                        <MirrorCamera
                            onCapture={handleCapture}
                            onError={(err) => console.error(err)}
                            onClose={() => setShowMirror(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
