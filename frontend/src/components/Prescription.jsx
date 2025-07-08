import React, { useState } from 'react';
import { Download, Plus, Trash2, User, FileText, Calendar, Heart, Users, Phone, Mail } from 'lucide-react';

const TherapistVolunteerGenerator = () => {
  const [practitionerInfo, setPractitionerInfo] = useState({
    name: '',
    role: 'therapist', // therapist or volunteer
    specialization: '',
    organization: '',
    license: '',
    phone: '',
    email: '',
    address: ''
  });

  const [sessionRecord, setSessionRecord] = useState({
    clientName: '',
    age: '',
    sessionType: '',
    concerns: '',
    assessment: '',
    interventions: [{ type: '', description: '', goals: '', timeline: '' }],
    recommendations: '',
    nextSession: '',
    referrals: ''
  });

  const addIntervention = () => {
    setSessionRecord(prev => ({
      ...prev,
      interventions: [...prev.interventions, { type: '', description: '', goals: '', timeline: '' }]
    }));
  };

  const removeIntervention = (index) => {
    setSessionRecord(prev => ({
      ...prev,
      interventions: prev.interventions.filter((_, i) => i !== index)
    }));
  };

  const updateIntervention = (index, field, value) => {
    setSessionRecord(prev => ({
      ...prev,
      interventions: prev.interventions.map((intervention, i) => 
        i === index ? { ...intervention, [field]: value } : intervention
      )
    }));
  };

  const generatePDF = async () => {
    // Load jsPDF from CDN if not already loaded
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      document.head.appendChild(script);
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = 210;
    const margin = 20;
    let yPosition = 20;

    // Helper function to add text with word wrapping
    const addWrappedText = (text, x, y, maxWidth, fontSize = 10) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * fontSize * 0.4);
    };

    // Header - Organization Info
    doc.setFillColor(147, 197, 114); // Calming green
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(18);
    doc.text(practitionerInfo.organization || 'Wellness & Support Center', margin, 15);
    
    doc.setFontSize(12);
    const roleText = practitionerInfo.role === 'therapist' ? 'Licensed Therapist' : 'Certified Volunteer';
    doc.text(`${practitionerInfo.name || 'Practitioner Name'} - ${roleText}`, margin, 25);
    
    if (practitionerInfo.specialization) {
      doc.text(`Specialization: ${practitionerInfo.specialization}`, margin, 32);
    }
    if (practitionerInfo.license && practitionerInfo.role === 'therapist') {
      doc.text(`License: ${practitionerInfo.license}`, margin, 39);
    }
    
    doc.setFontSize(10);
    if (practitionerInfo.phone) doc.text(practitionerInfo.phone, pageWidth - margin - 40, 25);
    if (practitionerInfo.email) doc.text(practitionerInfo.email, pageWidth - margin - 40, 32);

    yPosition = 60;

    // Date
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 30, yPosition);
    yPosition += 15;

    // Client Information
    doc.setFillColor(173, 216, 230); // Light blue
    doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 25, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('CLIENT INFORMATION', margin, yPosition + 5);
    
    yPosition += 15;
    doc.setFontSize(11);
    doc.text(`Name: ${sessionRecord.clientName || 'N/A'}`, margin, yPosition);
    doc.text(`Age: ${sessionRecord.age || 'N/A'}`, margin + 80, yPosition);
    doc.text(`Session Type: ${sessionRecord.sessionType || 'N/A'}`, margin + 120, yPosition);
    yPosition += 20;

    // Concerns & Assessment
    if (sessionRecord.concerns) {
      doc.setFillColor(255, 218, 185); // Peach
      doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 15, 'F');
      doc.setFontSize(12);
      doc.text('PRESENTING CONCERNS:', margin, yPosition + 5);
      yPosition += 10;
      doc.setFontSize(10);
      yPosition = addWrappedText(sessionRecord.concerns, margin, yPosition, pageWidth - 2 * margin);
      yPosition += 10;
    }

    if (sessionRecord.assessment) {
      doc.setFillColor(221, 160, 221); // Plum
      doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 15, 'F');
      doc.setFontSize(12);
      doc.text('ASSESSMENT & OBSERVATIONS:', margin, yPosition + 5);
      yPosition += 10;
      doc.setFontSize(10);
      yPosition = addWrappedText(sessionRecord.assessment, margin, yPosition, pageWidth - 2 * margin);
      yPosition += 10;
    }

    // Interventions/Support Provided
    if (sessionRecord.interventions.some(intervention => intervention.type)) {
      doc.setFillColor(144, 238, 144); // Light green
      doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 15, 'F');
      doc.setFontSize(14);
      doc.text('INTERVENTIONS & SUPPORT PROVIDED', margin, yPosition + 5);
      yPosition += 20;

      sessionRecord.interventions.forEach((intervention, index) => {
        if (intervention.type) {
          doc.setFontSize(12);
          doc.text(`${index + 1}. ${intervention.type}`, margin, yPosition);
          yPosition += 8;
          
          doc.setFontSize(10);
          if (intervention.description) {
            yPosition = addWrappedText(`   Description: ${intervention.description}`, margin, yPosition, pageWidth - 2 * margin, 10);
          }
          if (intervention.goals) {
            yPosition = addWrappedText(`   Goals: ${intervention.goals}`, margin, yPosition, pageWidth - 2 * margin, 10);
          }
          if (intervention.timeline) doc.text(`   Timeline: ${intervention.timeline}`, margin, yPosition), yPosition += 6;
          yPosition += 5;
        }
      });
    }

    // Recommendations
    if (sessionRecord.recommendations) {
      yPosition += 5;
      doc.setFillColor(255, 239, 213); // Bisque
      doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 15, 'F');
      doc.setFontSize(12);
      doc.text('RECOMMENDATIONS & HOMEWORK:', margin, yPosition + 5);
      yPosition += 15;
      doc.setFontSize(10);
      yPosition = addWrappedText(sessionRecord.recommendations, margin, yPosition, pageWidth - 2 * margin);
    }

    // Referrals
    if (sessionRecord.referrals) {
      yPosition += 10;
      doc.setFillColor(255, 192, 203); // Pink
      doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 15, 'F');
      doc.setFontSize(12);
      doc.text('REFERRALS & RESOURCES:', margin, yPosition + 5);
      yPosition += 15;
      doc.setFontSize(10);
      yPosition = addWrappedText(sessionRecord.referrals, margin, yPosition, pageWidth - 2 * margin);
    }

    // Next Session
    if (sessionRecord.nextSession) {
      yPosition += 10;
      doc.setFontSize(11);
      doc.text(`Next Session: ${sessionRecord.nextSession}`, margin, yPosition);
    }

    // Footer
    yPosition = Math.max(yPosition + 20, 250);
    doc.setDrawColor(147, 197, 114);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    doc.setFontSize(10);
    const roleTitle = practitionerInfo.role === 'therapist' ? 'Licensed Therapist' : 'Certified Volunteer';
    doc.text(`${practitionerInfo.name || 'Practitioner Name'} - ${roleTitle}`, margin, yPosition);
    doc.text('Professional Signature', pageWidth - margin - 35, yPosition);

    // Save the PDF
    const fileName = sessionRecord.clientName 
      ? `session_notes_${sessionRecord.clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      : `session_notes_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-8 border border-white/20">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Therapy & Support Session Generator
            </h1>
            <p className="text-gray-600">Create professional session notes and care plans</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Practitioner Information */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-green-400 to-blue-400 rounded-xl">
                <User className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Practitioner Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={practitionerInfo.role}
                  onChange={(e) => setPractitionerInfo(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/50"
                >
                  <option value="therapist">Licensed Therapist</option>
                  <option value="volunteer">Certified Volunteer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={practitionerInfo.name}
                  onChange={(e) => setPractitionerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/50"
                  placeholder="Sarah Johnson"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialization/Focus Area</label>
                <input
                  type="text"
                  value={practitionerInfo.specialization}
                  onChange={(e) => setPractitionerInfo(prev => ({ ...prev, specialization: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/50"
                  placeholder="Anxiety & Depression, Crisis Support, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organization/Center</label>
                <input
                  type="text"
                  value={practitionerInfo.organization}
                  onChange={(e) => setPractitionerInfo(prev => ({ ...prev, organization: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/50"
                  placeholder="Community Wellness Center"
                />
              </div>

              {practitionerInfo.role === 'therapist' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                  <input
                    type="text"
                    value={practitionerInfo.license}
                    onChange={(e) => setPractitionerInfo(prev => ({ ...prev, license: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/50"
                    placeholder="LCSW-12345"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={practitionerInfo.phone}
                    onChange={(e) => setPractitionerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/50"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={practitionerInfo.email}
                    onChange={(e) => setPractitionerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/50"
                    placeholder="sarah@wellnesscenter.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organization Address</label>
                <textarea
                  value={practitionerInfo.address}
                  onChange={(e) => setPractitionerInfo(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/50 resize-none"
                  rows="2"
                  placeholder="123 Wellness Avenue, City, State 12345"
                />
              </div>
            </div>
          </div>

          {/* Client & Session */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Session Notes</h2>
            </div>

            <div className="space-y-6">
              {/* Client Info */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={sessionRecord.clientName}
                    onChange={(e) => setSessionRecord(prev => ({ ...prev, clientName: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/70"
                    placeholder="Client Name"
                  />
                  <input
                    type="number"
                    value={sessionRecord.age}
                    onChange={(e) => setSessionRecord(prev => ({ ...prev, age: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/70"
                    placeholder="Age"
                  />
                  <select
                    value={sessionRecord.sessionType}
                    onChange={(e) => setSessionRecord(prev => ({ ...prev, sessionType: e.target.value }))}
                    className="px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/70"
                  >
                    <option value="">Session Type</option>
                    <option value="Individual Therapy">Individual Therapy</option>
                    <option value="Group Session">Group Session</option>
                    <option value="Crisis Support">Crisis Support</option>
                    <option value="Intake Assessment">Intake Assessment</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Support Call">Support Call</option>
                  </select>
                </div>
              </div>

              {/* Concerns & Assessment */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Presenting Concerns</label>
                  <textarea
                    value={sessionRecord.concerns}
                    onChange={(e) => setSessionRecord(prev => ({ ...prev, concerns: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/50 resize-none"
                    rows="3"
                    placeholder="What brought the client in today? Current concerns and challenges..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assessment & Observations</label>
                  <textarea
                    value={sessionRecord.assessment}
                    onChange={(e) => setSessionRecord(prev => ({ ...prev, assessment: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/50 resize-none"
                    rows="3"
                    placeholder="Mental status, mood, behavioral observations, progress notes..."
                  />
                </div>
              </div>

              {/* Interventions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-lg font-medium text-gray-800">Interventions & Support Provided</label>
                  <button
                    onClick={addIntervention}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-400 to-blue-400 text-white rounded-xl hover:from-green-500 hover:to-blue-500 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-4 h-4" />
                    Add Intervention
                  </button>
                </div>

                <div className="space-y-4">
                  {sessionRecord.interventions.map((intervention, index) => (
                    <div key={index} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-gray-800">Intervention {index + 1}</span>
                        </div>
                        {sessionRecord.interventions.length > 1 && (
                          <button
                            onClick={() => removeIntervention(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                          value={intervention.type}
                          onChange={(e) => updateIntervention(index, 'type', e.target.value)}
                          className="px-3 py-2 rounded-lg border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all bg-white/70"
                        >
                          <option value="">Select Intervention Type</option>
                          <option value="Cognitive Behavioral Therapy">CBT Techniques</option>
                          <option value="Mindfulness Practice">Mindfulness Practice</option>
                          <option value="Crisis Intervention">Crisis Intervention</option>
                          <option value="Active Listening">Active Listening</option>
                          <option value="Psychoeducation">Psychoeducation</option>
                          <option value="Coping Skills">Coping Skills Training</option>
                          <option value="Support & Validation">Support & Validation</option>
                          <option value="Resource Connection">Resource Connection</option>
                        </select>
                        <input
                          type="text"
                          value={intervention.timeline}
                          onChange={(e) => updateIntervention(index, 'timeline', e.target.value)}
                          className="px-3 py-2 rounded-lg border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all bg-white/70"
                          placeholder="Timeline (e.g., ongoing, 2 weeks)"
                        />
                      </div>
                      <textarea
                        value={intervention.description}
                        onChange={(e) => updateIntervention(index, 'description', e.target.value)}
                        className="w-full mt-3 px-3 py-2 rounded-lg border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all bg-white/70 resize-none"
                        rows="2"
                        placeholder="Describe the intervention or technique used..."
                      />
                      <textarea
                        value={intervention.goals}
                        onChange={(e) => updateIntervention(index, 'goals', e.target.value)}
                        className="w-full mt-3 px-3 py-2 rounded-lg border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all bg-white/70 resize-none"
                        rows="2"
                        placeholder="Goals and expected outcomes..."
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations & Next Steps */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations & Homework</label>
                  <textarea
                    value={sessionRecord.recommendations}
                    onChange={(e) => setSessionRecord(prev => ({ ...prev, recommendations: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/50 resize-none"
                    rows="3"
                    placeholder="Self-care recommendations, homework assignments, practice exercises..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Referrals & Resources</label>
                  <textarea
                    value={sessionRecord.referrals}
                    onChange={(e) => setSessionRecord(prev => ({ ...prev, referrals: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/50 resize-none"
                    rows="3"
                    placeholder="Referrals to other professionals, community resources, support groups..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Next Session/Follow-up</label>
                  <input
                    type="text"
                    value={sessionRecord.nextSession}
                    onChange={(e) => setSessionRecord(prev => ({ ...prev, nextSession: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/50"
                    placeholder="e.g., Weekly sessions, Follow-up in 2 weeks, As needed"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Generate PDF Button */}
        <div className="mt-8 text-center">
          <button
            onClick={generatePDF}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white text-lg font-semibold rounded-2xl hover:from-green-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl"
          >
            <Download className="w-6 h-6" />
            Generate & Download Session Notes PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default TherapistVolunteerGenerator;