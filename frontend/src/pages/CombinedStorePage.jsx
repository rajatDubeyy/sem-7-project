import React from 'react';
import Navbar from '../components/Navbar';
import RedeemStore from '../components/Store';
import TherapistList from '../components/TherapistList';

const CombinedStorePage = () => {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
          <section id="redeem">
            <h2 className="text-4xl font-bold mb-6 text-center">📚 Redeem Self-Help Books</h2>
            <RedeemStore />
          </section>
        </div>
      </div>
    </>
  );
};

export default CombinedStorePage;
