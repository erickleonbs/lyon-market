'use client';

import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';

interface OrganizationCardProps {
    id: string;
    name: string;
    category: string;
    imageUrl: string;
    rating: number;
    location: string;
}

export function OrganizationCard({ id, name, category, imageUrl, rating, location }: OrganizationCardProps) {
    return (
        <Link href={`/organization/${id}`} className="group block h-full">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                {/* Image */}
                <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                        {category}
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate pr-2">{name}</h3>
                        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                            <Star size={14} className="fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-bold">{rating}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-sm mb-4">
                        <MapPin size={16} />
                        <span className="truncate">{location}</span>
                    </div>

                    <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-sm">
                        <span className="text-purple-600 font-medium group-hover:underline">Ver servicios</span>
                        <span className="text-zinc-400">→</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
