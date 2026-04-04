import React, { useState, useEffect } from 'react';
import { HelpCircle, MessageSquare, Phone, Mail, ChevronRight, X, Bot, Clock, CheckCircle, MessageCircle } from 'lucide-react';
import { AIChatBoard } from '../components/AIChatBoard';
import { ContactForm } from '../components/ContactForm';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

interface SupportMessage {
  id: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'responded';
  createdAt: string;
  response?: string;
  respondedAt?: string;
}

export const Support: React.FC = () => {
  const [showChat, setShowChat] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [userMessages, setUserMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'support_messages'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportMessage[];
      setUserMessages(msgs);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'support_messages');
    });

    return () => unsubscribe();
  }, []);
  
  const faqs = [
    { q: "How do I file a claim?", a: "ErgoShield automatically detects weather disruptions. If you've been affected by an event we missed, you can file a manual claim in the Claims section." },
    { q: "When will I receive my payout?", a: "Parametric payouts are usually processed within 24 hours of the trigger event being confirmed." },
    { q: "Can I change my coverage plan?", a: "Yes, you can update your coverage preferences in your Profile settings at any time." },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="text-center">
        <h2 className="text-4xl font-black text-neutral-900 tracking-tighter mb-4">How can we help?</h2>
        <p className="text-neutral-500 text-lg font-medium">Our AI assistant and support team are here for you 24/7.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-neutral-100 shadow-sm text-center">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageSquare size={28} />
          </div>
          <h3 className="font-bold text-neutral-900 mb-2">AI Chat Board</h3>
          <p className="text-sm text-neutral-500 mb-6">Talk to our AI assistant for instant answers.</p>
          <button 
            onClick={() => setShowChat(true)}
            className="w-full py-3 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors"
          >
            Start Chat
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showEmailForm && <ContactForm onClose={() => setShowEmailForm(false)} />}
        {showChat && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tight flex items-center gap-2">
                <Bot className="text-emerald-500" size={24} />
                AI Support Chat
              </h3>
              <button 
                onClick={() => setShowChat(false)}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400"
              >
                <X size={20} />
              </button>
            </div>
            <AIChatBoard />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-[40px] border border-neutral-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-neutral-900">Your Support History</h3>
          <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">
            {userMessages.length} Messages
          </span>
        </div>
        <div className="divide-y divide-neutral-100">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : userMessages.length === 0 ? (
            <div className="p-12 text-center text-neutral-400">
              <p className="font-medium">No support history found.</p>
            </div>
          ) : (
            userMessages.map((msg) => (
              <div key={msg.id} className="p-8 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-neutral-900 mb-1">{msg.subject}</h4>
                    <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                      <Clock size={12} />
                      {new Date(msg.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                    msg.status === 'new' ? 'bg-emerald-500 text-white' : 
                    msg.status === 'read' ? 'bg-blue-500 text-white' : 'bg-neutral-200 text-neutral-500'
                  }`}>
                    {msg.status}
                  </span>
                </div>
                <p className="text-neutral-600 text-sm bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                  {msg.message}
                </p>
                {msg.response && (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      <CheckCircle size={12} />
                      Support Response • {new Date(msg.respondedAt!).toLocaleString()}
                    </div>
                    <p className="text-emerald-900 text-sm bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      {msg.response}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-neutral-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-neutral-100">
          <h3 className="text-xl font-bold text-neutral-900">Frequently Asked Questions</h3>
        </div>
        <div className="divide-y divide-neutral-100">
          {faqs.map((faq, i) => (
            <div key={i} className="p-8 hover:bg-neutral-50 transition-colors cursor-pointer group">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-neutral-900">{faq.q}</h4>
                <ChevronRight size={20} className="text-neutral-300 group-hover:text-emerald-600 transition-colors" />
              </div>
              <p className="text-neutral-500 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
