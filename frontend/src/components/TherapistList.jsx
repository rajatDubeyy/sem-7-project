import React, { useEffect, useState } from "react";
import { Mail, UserCheck, AlertCircle, Loader2 } from "lucide-react";

const TherapistList = () => {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("http://localhost:5000/api/user/therapists");
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setTherapists(data);
      } catch (err) {
        console.error("Failed to fetch therapists:", err);
        setError("Failed to load therapists. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTherapists();
  }, []);

  const UserCard = ({ user, roleColor }) => (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105 shadow-lg">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-full ${roleColor} shadow-lg`}>
          <UserCheck className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white text-lg">{user.username}</h3>
          <div className="flex items-center text-white/80 text-sm mt-2">
            <Mail className="w-4 h-4 mr-2" />
            {user.email}
          </div>
        </div>
      </div>
    </div>
  );

  const SectionHeader = ({ title, count, icon: Icon }) => (
    <div className="flex items-center space-x-4 mb-8">
      <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl shadow-lg">
        <Icon className="w-8 h-8 text-white" />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-white">{title}</h2>
        <p className="text-white/70 text-lg">{count} {count === 1 ? 'member' : 'members'}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="flex items-center justify-center space-x-3 text-white">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-xl">Loading therapists...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 backdrop-blur-lg border border-red-400/30 rounded-xl p-6 flex items-center space-x-4">
        <AlertCircle className="w-8 h-8 text-red-300" />
        <div>
          <h3 className="font-semibold text-red-200 text-lg">Error Loading Data</h3>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <SectionHeader 
        title="Available Therapists" 
        count={therapists.length}
        icon={UserCheck}
      />
      {therapists.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {therapists.map((therapist) => (
            <UserCard 
              key={therapist._id} 
              user={therapist} 
              roleColor="bg-gradient-to-r from-purple-500 to-pink-500"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-white/70">
          <UserCheck className="w-16 h-16 mx-auto mb-6 text-white/40" />
          <p className="text-xl">No therapists available at the moment</p>
        </div>
      )}
    </div>
  );
};

export default TherapistList;
