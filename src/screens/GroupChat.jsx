import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { BellOff, CalendarDays, CheckCheck, Check, Ellipsis, Flag, ImagePlus, LogOut, MapPin, MapPinned, Plus, SendHorizontal, Users, X } from 'lucide-react';
import { getPerson, myRole, useStore, ME } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { daysFromToday, formatDay, formatTime, formatWhen } from '../lib/dates';
import { useNav } from '../lib/nav';
import { cx, firstName, resizeImageFile } from '../lib/utils';
import { Screen, TopBar } from '../components/Screen';
import { Avatar, Img, Sheet } from '../components/ui';
import { NotFound } from './PlanDetails';

const SUGGESTIONS = ['Looking forward to meeting everyone!', 'On my way 🚶', 'Running 5 min late', 'See you there!'];

function groupMessages(messages) {
  const out = [];
  let lastDay = null;
  messages.forEach((m, i) => {
    const day = daysFromToday(m.at);
    if (day !== lastDay) {
      out.push({ type: 'day', id: `d-${m.id}`, label: formatDay(m.at) });
      lastDay = day;
    }
    const prev = messages[i - 1];
    const next = messages[i + 1];
    out.push({
      type: 'msg',
      m,
      first: !prev || prev.from !== m.from || daysFromToday(prev.at) !== day || prev.kind === 'system',
      last: !next || next.from !== m.from || daysFromToday(next.at) !== day || next.kind === 'system',
    });
  });
  return out;
}

/** 05 — Group chat */
export default function GroupChat() {
  const { id } = useParams();
  const nav = useNav();
  const toast = useToast();
  const store = useStore();
  const { state, typing } = store;
  const chat = state.chats[id];
  const plan = chat ? state.plans[chat.planId] : null;
  const [text, setText] = useState('');
  const [menu, setMenu] = useState(false);
  const [attach, setAttach] = useState(false);
  const [members, setMembers] = useState(false);
  const [muted, setMuted] = useState(false);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const inputRef = useRef(null);
  const count = chat?.messages.length || 0;
  const typer = typing[id] ? getPerson(state, typing[id]) : null;

  useEffect(() => {
    store.setActiveChat(id);
    store.markChatRead(id);
    return () => store.setActiveChat(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (chat?.unread) store.markChatRead(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: count > 0 ? 'smooth' : 'auto' });
  }, [count, typer]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  if (!chat) return <NotFound what="chat" />;
  const isMember = chat.members.includes(ME);
  const rows = groupMessages(chat.messages);

  const send = (value) => {
    const v = (value ?? text).trim();
    if (!v) return;
    store.sendMessage(id, v);
    setText('');
    inputRef.current?.focus();
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await resizeImageFile(file, 480);
      store.sendMessage(id, '', { image: url });
    } catch (err) {
      toast.show({ title: 'Couldn’t send photo', body: err.message, icon: 'alert', tone: 'danger' });
    }
  };

  return (
    <Screen
      glow={false}
      noBody
      className="chat-screen"
      innerRef={scrollRef}
      header={
        <div className="chat-head">
          <TopBar
            back
            backTo="/inbox?tab=chats"
            center={
              <button type="button" className="chat-title" onClick={() => setMembers(true)}>
                <strong>{chat.title}</strong>
                <small>
                  {chat.members.length} members{muted ? ' · muted' : ''}
                </small>
              </button>
            }
            right={
              <button type="button" className="icon-btn" aria-label="Chat options" onClick={() => setMenu(true)}>
                <Ellipsis size={22} strokeWidth={2.4} />
              </button>
            }
            alwaysSolid
          />
          {plan && (
            <motion.div className="chat-plan" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Img src={plan.image} alt="" activity={plan.activity} className="chat-plan-img" />
              <div className="grow" style={{ minWidth: 0 }}>
                <h4 className="ellipsis">{plan.title}</h4>
                <p>
                  <CalendarDays size={14} strokeWidth={2.2} /> {formatWhen(plan.start)}
                </p>
                <p className="ellipsis">
                  <MapPin size={14} strokeWidth={2.2} /> {plan.venue}
                </p>
              </div>
              <button type="button" className="btn btn-primary btn-xs" onClick={() => nav.go(`/plan/${plan.id}`)}>
                View plan
              </button>
            </motion.div>
          )}
        </div>
      }
      footer={
        isMember ? (
          <div className="chat-compose-wrap">
            <AnimatePresence>
              {!text && chat.messages.filter((m) => m.from === ME).length < 2 && (
                <motion.div className="chip-row suggest" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" className="chip sm" onClick={() => send(s)}>
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <form
              className="chat-compose"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <motion.button type="button" className="icon-btn soft" aria-label="Attach" onClick={() => setAttach(true)} whileTap={{ rotate: 90, scale: 0.9 }}>
                <Plus size={22} strokeWidth={2.4} />
              </motion.button>
              <input ref={inputRef} className="input chat-input" placeholder="Message the group" value={text} onChange={(e) => setText(e.target.value)} aria-label="Message" maxLength={500} />
              <motion.button
                type="submit"
                className={cx('send-btn', text.trim() && 'ready')}
                aria-label="Send"
                whileTap={{ scale: 0.85 }}
                animate={{ rotate: text.trim() ? 0 : -20, scale: text.trim() ? 1 : 0.92 }}
              >
                <SendHorizontal size={21} strokeWidth={2.4} />
              </motion.button>
            </form>
          </div>
        ) : (
          <div className="note">
            <Users size={20} /> You’re no longer a member of this chat.
          </div>
        )
      }
    >
      <div className="chat-body">
        {rows.map((row) => {
          if (row.type === 'day') {
            return (
              <div key={row.id} className="divider-label">
                <span>{row.label}</span>
              </div>
            );
          }
          const { m, first, last } = row;
          if (m.kind === 'system') {
            return (
              <motion.div key={m.id} className="sys-msg" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                {m.text}
              </motion.div>
            );
          }
          const mine = m.from === ME;
          const who = getPerson(state, m.from);
          return (
            <motion.div
              key={m.id}
              className={cx('msg', mine ? 'mine' : 'theirs', first && 'first', last && 'last')}
              initial={{ opacity: 0, y: 14, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 460, damping: 30 }}
              style={{ originX: mine ? 1 : 0, originY: 1 }}
            >
              {!mine && <span className="msg-av">{last ? <Avatar person={who} size={40} /> : null}</span>}
              <div className="msg-col">
                {!mine && first && <span className="msg-name">{firstName(who.name)}</span>}
                <div className={cx('bubble', m.image && 'has-image')}>
                  {m.image ? <img src={m.image} alt="Shared photo" className="bubble-img" /> : <span className="bubble-text">{m.text}</span>}
                  <span className="bubble-meta">
                    {formatTime(m.at)}
                    {mine && (m.status === 'read' ? <CheckCheck size={15} strokeWidth={2.4} /> : <Check size={15} strokeWidth={2.4} />)}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
        <AnimatePresence>
          {typer && (
            <motion.div key="typing" className="msg theirs first last" initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ originX: 0 }}>
              <span className="msg-av">
                <Avatar person={typer} size={40} />
              </span>
              <div className="msg-col">
                <span className="msg-name">{firstName(typer.name)}</span>
                <div className="bubble">
                  <span className="typing">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />

      <Sheet open={attach} onClose={() => setAttach(false)} title="Share with the group">
        <div className="attach-grid">
          <button
            type="button"
            className="attach"
            onClick={() => {
              setAttach(false);
              fileRef.current?.click();
            }}
          >
            <span>
              <ImagePlus size={24} strokeWidth={2} />
            </span>
            Photo
          </button>
          <button
            type="button"
            className="attach"
            onClick={() => {
              setAttach(false);
              send(`📍 I’m near ${plan?.venue || 'the venue'}`);
            }}
          >
            <span>
              <MapPinned size={24} strokeWidth={2} />
            </span>
            I’m nearby
          </button>
          <button
            type="button"
            className="attach"
            disabled={!plan || daysFromToday(plan.start) !== 0 || myRole(state, plan) === 'none'}
            onClick={() => {
              setAttach(false);
              nav.go(`/plan/${plan.id}/checkin`);
            }}
          >
            <span>
              <Check size={24} strokeWidth={2.4} />
            </span>
            Check in
          </button>
        </div>
        <p className="t-cap mt-12">Live location is never shared — only the messages you send.</p>
      </Sheet>

      <Sheet open={menu} onClose={() => setMenu(false)} title={chat.title}>
        <div className="list">
          {plan && (
            <button type="button" className="list-row" onClick={() => { setMenu(false); nav.go(`/plan/${plan.id}`); }}>
              <CalendarDays className="row-icon" size={20} /> <span className="row-text">View plan</span>
            </button>
          )}
          <button type="button" className="list-row" onClick={() => { setMenu(false); setMembers(true); }}>
            <Users className="row-icon" size={20} /> <span className="row-text">Members ({chat.members.length})</span>
          </button>
          <button
            type="button"
            className="list-row"
            onClick={() => {
              setMuted((v) => !v);
              setMenu(false);
              toast.show({ title: muted ? 'Chat unmuted' : 'Chat muted', body: chat.title, icon: 'bell' });
            }}
          >
            <BellOff className="row-icon" size={20} /> <span className="row-text">{muted ? 'Unmute' : 'Mute'} notifications</span>
          </button>
          <button type="button" className="list-row danger" onClick={() => { setMenu(false); nav.go(`/report?plan=${chat.planId}`); }}>
            <Flag className="row-icon" size={20} /> <span className="row-text">Report a concern</span>
          </button>
          {plan && myRole(state, plan) === 'joined' && (
            <button
              type="button"
              className="list-row danger"
              onClick={() => {
                setMenu(false);
                store.leavePlan(plan.id);
                toast.show({ title: 'You left the plan', body: plan.title, icon: 'check' });
                nav.back('/inbox?tab=chats');
              }}
            >
              <LogOut className="row-icon" size={20} /> <span className="row-text">Leave plan & chat</span>
            </button>
          )}
        </div>
      </Sheet>

      <Sheet open={members} onClose={() => setMembers(false)} title={`Members (${chat.members.length})`}>
        <div className="list">
          {chat.members.map((mid) => {
            const p = getPerson(state, mid);
            return (
              <Fragment key={mid}>
                <button
                  type="button"
                  className="list-row"
                  onClick={() => {
                    setMembers(false);
                    nav.go(p.isMe ? '/profile' : `/person/${mid}`);
                  }}
                >
                  <Avatar person={p} size={40} />
                  <span className="row-text">
                    {p.isMe ? `${p.name} (you)` : p.name}
                    {plan?.hostId === mid && <small>Host</small>}
                  </span>
                </button>
              </Fragment>
            );
          })}
        </div>
        <button type="button" className="btn btn-soft btn-block mt-12" onClick={() => setMembers(false)}>
          <X size={18} /> Close
        </button>
      </Sheet>
    </Screen>
  );
}
