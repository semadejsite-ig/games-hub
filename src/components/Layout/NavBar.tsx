'use client';
import Link from 'next/link';
import { User, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function NavBar() {
    const { user, signInWithGoogle, signOut, loading } = useAuth();

    return (
        <nav className="w-full bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link href="/" className="text-xl font-bold text-yellow-500 tracking-wider hover:text-yellow-400 transition-colors">
                    JOGOS BÍBLICOS <span className="text-xs text-blue-400 block -mt-1">PLATAFORMA</span>
                </Link>

                <div className="flex items-center gap-4">
                    {loading ? (
                        <div className="h-8 w-24 bg-slate-800 animate-pulse rounded-full" />
                    ) : user ? (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                {user.user_metadata?.avatar_url ? (
                                    <img
                                        src={user.user_metadata.avatar_url}
                                        alt="Avatar"
                                        className="w-8 h-8 rounded-full border border-blue-500"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                                        <User size={16} />
                                    </div>
                                )}
                                <span className="hidden sm:inline">
                                    {user.user_metadata?.full_name || 'Usuário'}
                                </span>
                            </div>
                            <button
                                onClick={signOut}
                                title="Sair"
                                className="bg-slate-800 p-2 rounded-full hover:bg-red-900/50 text-gray-400 hover:text-red-400 transition-colors"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={signInWithGoogle}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors shadow-lg shadow-blue-900/20"
                        >
                            <LogIn size={16} /> ENTRAR
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
