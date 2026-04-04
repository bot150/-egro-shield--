import React, { useState } from 'react';
import { Send, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

interface ContactFormProps {
  onClose: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({ onClose }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const messageData = {
        uid: auth.currentUser?.uid || 'anonymous',
        email: auth.currentUser?.email || 'sreenandasai24@gmail.com', // Defaulting to user's email as requested in context
        subject: formData.subject,
        message: formData.message,
        status: 'new',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'support_messages'), messageData);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error sending message:', error);
      handleFirestoreError(error, OperationType.CREATE, 'support_messages');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400 z-10"
        >
          <X size={24} />
        </button>

        <div className="p-10">
          {!isSubmitted ? (
            <>
              <div className="mb-8">
                <h3 className="text-3xl font-black text-neutral-900 tracking-tighter mb-2">Send us an Email</h3>
                <p className="text-neutral-500 font-medium">We'll get back to you at sreenandasai24@gmail.com</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Subject</label>
                  <input
                    required
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="How can we help?"
                    className="w-full px-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your issue in detail..."
                    className="w-full px-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-5 bg-neutral-900 text-white rounded-2xl font-black text-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-neutral-200"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={20} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-3xl font-black text-neutral-900 tracking-tighter mb-4">Message Sent!</h3>
              <p className="text-neutral-500 font-medium mb-10 leading-relaxed">
                Thank you for reaching out. We've received your query and will respond to 
                <span className="text-neutral-900 font-bold block mt-1">sreenandasai24@gmail.com</span>
                within 24 hours.
              </p>
              <button
                onClick={onClose}
                className="w-full py-5 bg-neutral-900 text-white rounded-2xl font-black text-lg hover:bg-emerald-600 transition-all"
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
