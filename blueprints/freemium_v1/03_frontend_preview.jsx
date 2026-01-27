/**
 * SMARTCOPY FREEMIUM FRONTEND COMPONENT
 * Status: DRAFT / INACTIVE
 * 
 * Component: PreviewWithLock.jsx
 * Use this to replace the current standard Preview component when enabling Freemium.
 */

import React, { useState, useEffect } from 'react';
import { Lock, Download, Coins } from 'lucide-react';

const PreviewWithLock = ({ orderId, totalPages, isUnlocked, initialBalance }) => {
  const [pages, setPages] = useState([]); // Array of image URLs
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [userBalance, setUserBalance] = useState(initialBalance || 0);
  const [unlocked, setUnlocked] = useState(isUnlocked);

  const previewLimit = 10;
  const unlockCost = totalPages <= 20 ? 3 : totalPages <= 50 ? 5 : 8;

  const handleUnlock = async () => {
    if (userBalance < unlockCost) {
      alert("Saldo token tidak cukup! Silakan top-up.");
      // Redirect to topup
      return;
    }
    
    if (confirm(`Buka dokumen penuh dengan ${unlockCost} token?`)) {
        // Call Backend API
        // const res = await axios.post(/api/orders/${orderId}/unlock);
        // if (res.success) { setUnlocked(true); loadAllPages(); }
        console.log("Mock: Unlocking document...");
        setUnlocked(true);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-100 p-8 min-h-screen">
      
      {/* Header Status */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div>
            <h2 className="font-bold text-xl text-gray-800">Preview Dokumen</h2>
            <p className="text-sm text-gray-500">{unlocked ? '✅ Full Access' : '🔒 Free Preview Mode'}</p>
        </div>
        <div className="flex items-center gap-3">
             <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                <Coins className="w-4 h-4" />
                {userBalance} Token
             </div>
             {unlocked && (
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
                    <Download className="w-4 h-4" /> Download DOCX
                </button>
             )}
        </div>
      </div>

      {/* Pages Container */}
      <div className="space-y-6">
        
        {/* Render visible pages (Mocking 1 to Total) */}
        {Array.from({ length: totalPages }).map((_, index) => {
            const pageNum = index + 1;
            const isLocked = !unlocked && pageNum > previewLimit;

            if (isLocked) return null; // Don't render locked pages individually in the list

            return (
                <div key={pageNum} className="relative bg-white shadow-lg mx-auto w-[21cm] h-[29.7cm] flex items-center justify-center text-gray-400">
                    <span className="text-4xl font-bold opacity-20">Page {pageNum}</span>
                    <img src={`/mock/page_${pageNum}.jpg`} alt={`Page ${pageNum}`} className="absolute inset-0 w-full h-full object-contain" />
                </div>
            );
        })}

        {/* Locked Overlay Section */}
        {!unlocked && totalPages > previewLimit && (
            <div className="relative mt-8">
                {/* Blurred Background effect */}
                <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-transparent to-white/90 z-10"></div>
                
                <div className="bg-white shadow-2xl rounded-2xl p-10 text-center border border-blue-100 relative z-20 max-w-2xl mx-auto -mt-20">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {totalPages - previewLimit} Halaman Terkunci
                    </h3>
                    
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Anda telah melihat 10 dari {totalPages} halaman. Buka dokumen penuh untuk melihat sisa halaman dan mengunduh hasil format.
                    </p>

                    <div className="bg-blue-50 rounded-xl p-6 mb-8 inline-block w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-600">Harga Unlock</span>
                            <span className="font-bold text-lg">{unlockCost} Token</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Saldo Anda</span>
                            <span className={`${userBalance >= unlockCost ? 'text-green-600' : 'text-red-500'} font-bold`}>
                                {userBalance} Token
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleUnlock}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 block"
                        >
                            💎 Buka Sekarang ({unlockCost} Token)
                        </button>
                        
                        <p className="text-xs text-gray-400 mt-2">
                            Tidak punya token? <a href="#" className="text-blue-600 hover:underline">Beli Paket Hemat</a> atau <a href="#" className="text-blue-600 hover:underline">Dapatkan Token Gratis</a>
                        </p>
                    </div>
                </div>
                
                {/* Fake blurred pages below */}
                <div className="opacity-50 blur-sm pointer-events-none select-none mt-4">
                     <div className="bg-white shadow-lg mx-auto w-[21cm] h-[10cm] mb-4"></div>
                     <div className="bg-white shadow-lg mx-auto w-[21cm] h-[10cm]"></div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default PreviewWithLock;
