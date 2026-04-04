import React, { useState, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { User, Mail, Phone, Shield, CreditCard, MapPin, Calendar, Save, X, Loader2, AlertCircle, Zap, CheckCircle2, Upload } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { extractAadharData, extractBankData } from '../services/geminiService';

export const Profile: React.FC = () => {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    fullName: '',
    phoneNumber: '',
    aadharNumber: '',
    bankAccountNumber: '',
    ifscCode: '',
    age: 0,
    location: '',
  });

  const [uploadingDoc, setUploadingDoc] = useState<'aadhar' | 'bank' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const aadharInputRef = useRef<HTMLInputElement>(null);
  const bankInputRef = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  const handleEdit = () => {
    setEditedProfile({
      fullName: profile.fullName,
      phoneNumber: profile.phoneNumber,
      aadharNumber: profile.aadharNumber || '',
      bankAccountNumber: profile.bankAccountNumber || '',
      ifscCode: profile.ifscCode || '',
      age: profile.age || 0,
      location: profile.location || 'New Delhi',
    });
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!profile.uid) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (editedProfile.age < 18 || editedProfile.age > 100) {
        setError('Age must be between 18 and 100.');
        setLoading(false);
        return;
      }
      await updateDoc(doc(db, 'users', profile.uid), {
        fullName: editedProfile.fullName,
        phoneNumber: editedProfile.phoneNumber,
        aadharNumber: editedProfile.aadharNumber,
        bankAccountNumber: editedProfile.bankAccountNumber,
        ifscCode: editedProfile.ifscCode,
        age: editedProfile.age,
        location: editedProfile.location,
      });
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'aadhar' | 'bank') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(type);
    setError('');
    setSuccess('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        if (type === 'aadhar') {
          const data = await extractAadharData(base64, file.type);
          const extractedAge = calculateAge(data.dob);
          
          // Validation logic
          if (editedProfile.aadharNumber && data.aadharNumber.replace(/\s/g, '') !== editedProfile.aadharNumber.replace(/\s/g, '')) {
            setError(`Aadhar Number mismatch! Entered: ${editedProfile.aadharNumber}, Found in doc: ${data.aadharNumber}`);
            setUploadingDoc(null);
            return;
          }
          
          if (editedProfile.age && extractedAge !== editedProfile.age) {
            setError(`Age mismatch! Entered: ${editedProfile.age}, Found in doc: ${extractedAge} (DOB: ${data.dob})`);
            setUploadingDoc(null);
            return;
          }

          // If valid or if fields were empty, update them
          setEditedProfile(prev => ({
            ...prev,
            aadharNumber: data.aadharNumber,
            age: extractedAge,
            fullName: data.fullName // Optionally update name if it matches
          }));
          setSuccess('Aadhar verified successfully from document!');
        } else {
          const data = await extractBankData(base64, file.type);
          
          if (editedProfile.ifscCode && data.ifscCode.toUpperCase() !== editedProfile.ifscCode.toUpperCase()) {
            setError(`IFSC Code mismatch! Entered: ${editedProfile.ifscCode}, Found in doc: ${data.ifscCode}`);
            setUploadingDoc(null);
            return;
          }

          setEditedProfile(prev => ({
            ...prev,
            ifscCode: data.ifscCode,
            bankAccountNumber: data.accountNumber
          }));
          setSuccess('Bank details verified successfully from document!');
        }
        setUploadingDoc(null);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error processing document:', err);
      setError('Failed to process document. Please ensure it is a clear image.');
      setUploadingDoc(null);
    }
  };

  const infoItems = [
    { icon: Mail, label: 'Email', value: profile.email || 'Not Set' },
    { icon: Phone, label: 'Phone', value: profile.phoneNumber || 'Not Set' },
    { icon: Shield, label: 'Category', value: profile.category ? `${profile.category} (${profile.subCategory || 'General'})` : 'Not Set' },
    { icon: CreditCard, label: 'Aadhar', value: profile.aadharNumber ? `XXXX-XXXX-${profile.aadharNumber.slice(-4)}` : 'Not Set' },
    { icon: Calendar, label: 'Age', value: profile.age ? `${profile.age} Years` : 'Not Set' },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="h-32 bg-emerald-600"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-8">
            <div className="w-24 h-24 bg-white rounded-2xl p-1 shadow-lg overflow-hidden">
              <div className="w-full h-full bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-400 font-bold text-3xl overflow-hidden">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.fullName} className="w-full h-full object-cover" />
                ) : (
                  profile.fullName.charAt(0)
                )}
              </div>
            </div>
            {isEditing ? (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="bg-neutral-100 text-neutral-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-neutral-200 transition-colors flex items-center gap-2"
                >
                  <X size={16} /> Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              </div>
            ) : (
              <button 
                onClick={handleEdit}
                className="bg-neutral-900 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-neutral-800 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm font-medium flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 text-sm font-medium flex items-center gap-2">
              <CheckCircle2 size={16} />
              {success}
            </div>
          )}

          <div className="mb-8">
            {isEditing ? (
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    value={editedProfile.fullName}
                    onChange={(e) => setEditedProfile({ ...editedProfile, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Phone Number</label>
                  <input 
                    type="tel"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    value={editedProfile.phoneNumber}
                    onChange={(e) => setEditedProfile({ ...editedProfile, phoneNumber: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Aadhar Number</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                      value={editedProfile.aadharNumber}
                      onChange={(e) => setEditedProfile({ ...editedProfile, aadharNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Age</label>
                    <input 
                      type="number"
                      min="18"
                      max="100"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                      value={editedProfile.age}
                      onChange={(e) => setEditedProfile({ ...editedProfile, age: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Bank Account</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                      value={editedProfile.bankAccountNumber}
                      onChange={(e) => setEditedProfile({ ...editedProfile, bankAccountNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">IFSC Code</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                      value={editedProfile.ifscCode}
                      onChange={(e) => setEditedProfile({ ...editedProfile, ifscCode: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-neutral-900">{profile.fullName}</h2>
                <p className="text-neutral-500 flex items-center gap-2 mt-1">
                  <Shield size={16} className="text-emerald-600" />
                  Verified Delivery Partner
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {infoItems.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-neutral-400 shadow-sm">
                  <item.icon size={20} />
                </div>
                <div>
                  <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">{item.label}</p>
                  <p className="text-neutral-900 font-medium">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-900">Document Verification</h3>
            <p className="text-sm text-neutral-500">Ensure your documents are up to date for instant payouts.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hidden File Inputs */}
          <input 
            type="file" 
            ref={aadharInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => handleFileUpload(e, 'aadhar')} 
          />
          <input 
            type="file" 
            ref={bankInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => handleFileUpload(e, 'bank')} 
          />

          {/* Aadhar Upload */}
          <div className={`p-6 rounded-2xl border-2 transition-all ${profile.aadharNumber ? 'bg-emerald-50 border-emerald-100' : 'bg-neutral-50 border-dashed border-neutral-200'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${profile.aadharNumber ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900">Aadhar Card</h4>
                  <p className="text-xs text-neutral-500">{profile.aadharNumber ? `Verified: XXXX-XXXX-${profile.aadharNumber.slice(-4)}` : 'Not Uploaded'}</p>
                </div>
              </div>
              {profile.aadharNumber && <CheckCircle2 size={20} className="text-emerald-600" />}
            </div>
            <button 
              onClick={() => aadharInputRef.current?.click()}
              disabled={uploadingDoc === 'aadhar'}
              className="w-full py-3 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-600 flex items-center justify-center gap-2 hover:border-emerald-500 hover:text-emerald-600 transition-all disabled:opacity-50"
            >
              {uploadingDoc === 'aadhar' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {profile.aadharNumber ? 'Update Aadhar' : 'Upload Aadhar'}
            </button>
          </div>

          {/* Bank Passbook Upload */}
          <div className={`p-6 rounded-2xl border-2 transition-all ${profile.bankAccountNumber ? 'bg-emerald-50 border-emerald-100' : 'bg-neutral-50 border-dashed border-neutral-200'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${profile.bankAccountNumber ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900">Bank Passbook</h4>
                  <p className="text-xs text-neutral-500">{profile.bankAccountNumber ? `Verified: XXXX-${profile.bankAccountNumber.slice(-4)}` : 'Not Uploaded'}</p>
                </div>
              </div>
              {profile.bankAccountNumber && <CheckCircle2 size={20} className="text-emerald-600" />}
            </div>
            <button 
              onClick={() => bankInputRef.current?.click()}
              disabled={uploadingDoc === 'bank'}
              className="w-full py-3 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-600 flex items-center justify-center gap-2 hover:border-emerald-500 hover:text-emerald-600 transition-all disabled:opacity-50"
            >
              {uploadingDoc === 'bank' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {profile.bankAccountNumber ? 'Update Passbook' : 'Upload Passbook'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
