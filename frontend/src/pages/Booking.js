import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import axios from 'axios';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Calendar, Clock, Check } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const WHATSAPP_NUMBER = '00971501703131';

export default function Booking() {
  const { t, language } = useLanguage();
  const location = useLocation();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', date: '', timeSlot: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const timeSlots = ['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'];

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    if (location.state?.selectedPackage) {
      setSelectedPackage(location.state.selectedPackage);
    }
  }, [location.state]);

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API}/packages`);
      setPackages(response.data);
      if (!selectedPackage && response.data.length > 0) {
        const popular = response.data.find(p => p.is_popular) || response.data[0];
        setSelectedPackage(popular);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString(language === 'ar' ? 'ar-AE' : 'en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.date || !formData.timeSlot) {
      toast.error(language === 'en' ? 'Please fill all fields' : 'الرجاء ملء جميع الحقول');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/bookings`, {
        name: formData.name,
        phone: formData.phone,
        package_id: selectedPackage.id,
        package_name: language === 'en' ? selectedPackage.name_en : selectedPackage.name_ar,
        date: formData.date,
        time_slot: formData.timeSlot
      });

      const whatsappMessage = encodeURIComponent(
        `Hi! I've booked a session:\n\nName: ${formData.name}\nPackage: ${language === 'en' ? selectedPackage.name_en : selectedPackage.name_ar}\nDate: ${formData.date}\nTime: ${formData.timeSlot}\nPhone: ${formData.phone}`
      );
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`, '_blank');

      setSuccess(true);
      toast.success(t('bookingSuccess'));
    } catch (error) {
      toast.error(language === 'en' ? 'Something went wrong' : 'حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="pt-32 pb-20 px-6">
          <div className="container mx-auto max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card text-center"
            >
              <div className="w-20 h-20 rounded-full bg-blush mx-auto mb-6 flex items-center justify-center">
                <Check className="w-10 h-10 text-rose-deep" />
              </div>
              <h1 className="text-3xl font-playfair text-plum mb-4">{t('bookingSuccess')}</h1>
              <p className="text-plum-soft mb-6">{t('bookingSuccessMsg')}</p>
              <div className="p-6 bg-sand rounded-2xl mb-6">
                <p className="text-plum-soft mb-2"><strong>{t('fullName')}:</strong> {formData.name}</p>
                <p className="text-plum-soft mb-2"><strong>{t('selectPackage')}:</strong> {language === 'en' ? selectedPackage.name_en : selectedPackage.name_ar}</p>
                <p className="text-plum-soft mb-2"><strong>{t('selectDate')}:</strong> {formData.date}</p>
                <p className="text-plum-soft"><strong>{t('selectTime')}:</strong> {formData.timeSlot}</p>
              </div>
              <p className="text-sm text-plum-soft">
                {language === 'en' ? 'Remember to bring your makeup bag!' : 'تذكري إحضار حقيبة المكياج الخاصة بك!'}
              </p>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-playfair text-plum mb-4">
              {t('bookingTitle')}
            </h1>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Package Selection */}
            <div>
              <h3 className="text-lg font-medium text-plum mb-4">{t('selectPackage')}</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {packages.map(pkg => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`card cursor-pointer transition-all ${
                      selectedPackage?.id === pkg.id ? 'ring-2 ring-rose-deep' : ''
                    }`}
                    data-testid={`select-package-${pkg.id}`}
                  >
                    <p className="font-playfair text-plum text-center mb-2">
                      {language === 'en' ? pkg.name_en : pkg.name_ar}
                    </p>
                    <p className="text-rose-deep text-center font-bold">{t('aed')} {pkg.price_aed}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <h3 className="text-lg font-medium text-plum mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('selectDate')}
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {dates.map((date, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormData({ ...formData, date: formatDate(date) })}
                    className={`px-4 py-3 rounded-2xl border whitespace-nowrap ${
                      formData.date === formatDate(date)
                        ? 'bg-rose-deep text-cream border-rose-deep'
                        : 'bg-sand text-plum border-dusty-rose hover:border-rose-deep'
                    }`}
                    data-testid={`date-${index}`}
                  >
                    {index === 0 ? t('today') : formatDate(date)}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <h3 className="text-lg font-medium text-plum mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {t('selectTime')}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {timeSlots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setFormData({ ...formData, timeSlot: slot })}
                    className={`px-4 py-3 rounded-2xl border ${
                      formData.timeSlot === slot
                        ? 'bg-rose-deep text-cream border-rose-deep'
                        : 'bg-sand text-plum border-dusty-rose hover:border-rose-deep'
                    }`}
                    data-testid={`time-${slot}`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <input
                type="text"
                placeholder={t('fullName')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                data-testid="booking-name-input"
                required
              />
              <input
                type="tel"
                placeholder={t('phone')}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                data-testid="booking-phone-input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
              data-testid="booking-confirm-btn"
            >
              {loading ? (language === 'en' ? 'Booking...' : 'جاري الحجز...') : t('confirmBooking')}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
