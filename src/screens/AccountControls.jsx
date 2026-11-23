import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Ban, Bell, ChevronRight, Download, Eye, LogOut, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { useNav } from '../lib/nav';
import { fadeUp, stagger } from '../lib/motion';
import { cx, downloadFile } from '../lib/utils';
import Logo from '../components/Logo';
import { Screen, TopBar } from '../components/Screen';
import { Toggle } from '../components/ui';

/** 34 — Account controls */
export default function AccountControls() {
  const nav = useNav();
  const toast = useToast();
  const { state, setSetting, logout, deleteAccount } = useStore();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const visible = state.settings.visible;

  const download = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      profile: { ...state.user, photo: state.user.photo ? '(image)' : null },
      settings: state.settings,
      plansHosted: Object.values(state.plans).filter((p) => p.hostId === 'me'),
      plansJoined: Object.entries(state.joins).map(([planId, status]) => ({ planId, status, title: state.plans[planId]?.title })),
      friends: state.friends,
      reviews: state.reviews,
    };
    downloadFile('fryyday-my-data.json', JSON.stringify(data, null, 2));
    toast.show({ title: 'Your data is downloading', body: 'fryyday-my-data.json', icon: 'check' });
  };

  return (
    <Screen
      header={<TopBar back backTo="/settings" center={<Logo size={22} />} />}
      footer={
        <button
          type="button"
          className="btn btn-outline btn-block btn-lg"
          onClick={() => {
            logout();
            nav.replace('/welcome');
          }}
        >
          <LogOut size={20} strokeWidth={2.3} /> Sign out
        </button>
      }
    >
      <motion.div variants={stagger(0.05)} initial="hidden" animate="show">
        <motion.h1 variants={fadeUp} className="t-h1 mt-4 mb-16">
          Account Controls
        </motion.h1>
        <div className="list">
          <motion.div variants={fadeUp} className={cx('list-row', visible && 'accent-row')}>
            <Eye className="row-icon" size={22} strokeWidth={2} />
            <span className="row-text">
              Visibility status
              <small>{visible ? 'Visible to others on Fryyday' : 'Hidden — only friends can find you'}</small>
            </span>
            <Toggle on={visible} onChange={(v) => setSetting('visible', v)} label="Visibility status" />
          </motion.div>
          <motion.button variants={fadeUp} type="button" className="list-row" onClick={() => nav.go('/settings/notifications')}>
            <Bell className="row-icon" size={22} strokeWidth={2} />
            <span className="row-text">Notification preferences</span>
            <ChevronRight className="chev" size={20} />
          </motion.button>
          <motion.button variants={fadeUp} type="button" className="list-row" onClick={() => nav.go('/settings/blocked')}>
            <Ban className="row-icon" size={22} strokeWidth={2} />
            <span className="row-text">Blocked accounts</span>
            <ChevronRight className="chev" size={20} />
          </motion.button>
          <motion.button variants={fadeUp} type="button" className="list-row" onClick={download}>
            <Download className="row-icon" size={22} strokeWidth={2} />
            <span className="row-text">Download my data</span>
            <ChevronRight className="chev" size={20} />
          </motion.button>
          <motion.button variants={fadeUp} type="button" className="list-row" onClick={() => setConfirm(true)}>
            <Trash2 className="row-icon" size={22} strokeWidth={2} />
            <span className="row-text">Delete account</span>
            <motion.span animate={{ rotate: confirm ? 90 : 0 }} style={{ display: 'grid' }}>
              <ChevronRight className="chev" size={20} />
            </motion.span>
          </motion.button>
        </div>

        <AnimatePresence>
          {confirm && (
            <motion.div
              className="delete-card mt-12"
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <div style={{ padding: 18 }}>
                <h3 className="t-h3">Delete your account?</h3>
                <p className="t-sub mt-4">This will permanently remove your profile, plans, and data.</p>
                <div className="row gap-10 mt-16">
                  <button type="button" className="btn btn-outline btn-sm grow" onClick={() => setConfirm(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm grow"
                    disabled={deleting}
                    onClick={() => {
                      setDeleting(true);
                      setTimeout(() => {
                        nav.replace('/welcome');
                        deleteAccount();
                        toast.show({ title: 'Account deleted', body: 'Sorry to see you go. You’re always welcome back.', icon: 'heart' });
                      }, 700);
                    }}
                  >
                    {deleting ? <span className="spinner" /> : 'Delete account'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Screen>
  );
}
