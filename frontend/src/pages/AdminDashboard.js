import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import axios from 'axios';
import { Users, FileText, Calendar, LogOut, Download, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [vipSignups, setVipSignups] = useState([]);
  const [quizResponses, setQuizResponses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('admin_token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const [statsRes, vipRes, quizRes, bookingsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, config),
        axios.get(`${API}/admin/signups`, config),
        axios.get(`${API}/admin/quiz-responses`, config),
        axios.get(`${API}/admin/bookings`, config)
      ]);

      setStats(statsRes.data);
      setVipSignups(vipRes.data);
      setQuizResponses(quizRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin');
      }
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin');
  };

  const exportCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    const token = localStorage.getItem('admin_token');
    try {
      await axios.put(
        `${API}/admin/bookings/${bookingId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Booking updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update booking');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-plum-soft">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-sand border-b border-dusty-rose/20 py-4 px-6">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-playfair text-plum">{t('dashboard')}</h1>
          <button
            onClick={handleLogout}
            className="btn-secondary flex items-center gap-2"
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4" />
            {t('logout')}
          </button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'stats', label: t('stats'), icon: TrendingUp },
            { id: 'vip', label: t('vipSignups'), icon: Users },
            { id: 'quiz', label: t('quizResponses'), icon: FileText },
            { id: 'bookings', label: t('bookings'), icon: Calendar }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-full flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-rose-deep text-cream'
                  : 'bg-sand text-plum-soft hover:bg-blush'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-3 gap-6"
          >
            <div className="card text-center">
              <Users className="w-10 h-10 text-rose-deep mx-auto mb-4" />
              <p className="text-4xl font-bold text-plum mb-2">{stats.total_vip_signups}</p>
              <p className="text-plum-soft">Total VIP Signups</p>
            </div>
            <div className="card text-center">
              <FileText className="w-10 h-10 text-rose-deep mx-auto mb-4" />
              <p className="text-4xl font-bold text-plum mb-2">{stats.total_quizzes}</p>
              <p className="text-plum-soft">Quizzes Completed</p>
            </div>
            <div className="card text-center">
              <Calendar className="w-10 h-10 text-rose-deep mx-auto mb-4" />
              <p className="text-4xl font-bold text-plum mb-2">{stats.bookings_this_week}</p>
              <p className="text-plum-soft">Bookings This Week</p>
            </div>
          </motion.div>
        )}

        {/* VIP Signups Tab */}
        {activeTab === 'vip' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-playfair text-plum">VIP Signups ({vipSignups.length})</h2>
              <button
                onClick={() => exportCSV(vipSignups, 'vip-signups')}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('export')}
              </button>
            </div>
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dusty-rose/20">
                    <th className="text-start py-3 px-4 text-plum">Name</th>
                    <th className="text-start py-3 px-4 text-plum">Email</th>
                    <th className="text-start py-3 px-4 text-plum">Phone</th>
                    <th className="text-start py-3 px-4 text-plum">Language</th>
                    <th className="text-start py-3 px-4 text-plum">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {vipSignups.map(signup => (
                    <tr key={signup.id} className="border-b border-dusty-rose/10">
                      <td className="py-3 px-4 text-plum-soft">{signup.name}</td>
                      <td className="py-3 px-4 text-plum-soft">{signup.email || 'N/A'}</td>
                      <td className="py-3 px-4 text-plum-soft">{signup.phone || 'N/A'}</td>
                      <td className="py-3 px-4 text-plum-soft">{signup.language}</td>
                      <td className="py-3 px-4 text-plum-soft">
                        {new Date(signup.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Quiz Responses Tab */}
        {activeTab === 'quiz' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-playfair text-plum">Quiz Responses ({quizResponses.length})</h2>
              <button
                onClick={() => exportCSV(quizResponses, 'quiz-responses')}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('export')}
              </button>
            </div>
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dusty-rose/20">
                    <th className="text-start py-3 px-4 text-plum">Name</th>
                    <th className="text-start py-3 px-4 text-plum">Skin Type</th>
                    <th className="text-start py-3 px-4 text-plum">Concern</th>
                    <th className="text-start py-3 px-4 text-plum">Budget</th>
                    <th className="text-start py-3 px-4 text-plum">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {quizResponses.map(response => (
                    <tr key={response.id} className="border-b border-dusty-rose/10">
                      <td className="py-3 px-4 text-plum-soft">{response.name || 'Anonymous'}</td>
                      <td className="py-3 px-4 text-plum-soft capitalize">{response.skin_type}</td>
                      <td className="py-3 px-4 text-plum-soft capitalize">{response.concern}</td>
                      <td className="py-3 px-4 text-plum-soft capitalize">{response.budget}</td>
                      <td className="py-3 px-4 text-plum-soft">
                        {new Date(response.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-playfair text-plum">Bookings ({bookings.length})</h2>
              <button
                onClick={() => exportCSV(bookings, 'bookings')}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('export')}
              </button>
            </div>
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dusty-rose/20">
                    <th className="text-start py-3 px-4 text-plum">Name</th>
                    <th className="text-start py-3 px-4 text-plum">Phone</th>
                    <th className="text-start py-3 px-4 text-plum">Package</th>
                    <th className="text-start py-3 px-4 text-plum">Date</th>
                    <th className="text-start py-3 px-4 text-plum">Time</th>
                    <th className="text-start py-3 px-4 text-plum">Status</th>
                    <th className="text-start py-3 px-4 text-plum">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => (
                    <tr key={booking.id} className="border-b border-dusty-rose/10">
                      <td className="py-3 px-4 text-plum-soft">{booking.name}</td>
                      <td className="py-3 px-4 text-plum-soft">{booking.phone}</td>
                      <td className="py-3 px-4 text-plum-soft">{booking.package_name}</td>
                      <td className="py-3 px-4 text-plum-soft">{booking.date}</td>
                      <td className="py-3 px-4 text-plum-soft">{booking.time_slot}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={booking.status}
                          onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                          className="text-sm border border-dusty-rose rounded-full px-3 py-1"
                          data-testid={`status-select-${booking.id}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
