import { ArrowLeft, ArrowUpRight, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { profiles } from './editorial';
import { Avatar } from './views';
import SelectMenu from './SelectMenu';

const threads = [
  { id: 'sofia', note: 'Uma conversa sobre notas verdes', opener: 'Para começar pelo lado verde, eu compararia Arbo e Arbo Atlântica.', perfume: 'arbo-atlantica' },
  { id: 'mateo', note: 'Madeiras e especiarias', opener: 'Uma indicação para sentir o que o sândalo faz na pele.', perfume: 'santal' },
  { id: 'clara', note: 'Cítricos para o dia a dia', opener: 'Se você gosta de cítricos com chá verde, experimente Insensatez.', perfume: 'insensatez' },
];

export default function Inbox({ personId, conversations, append, navigate, getPerfumes, options }) {
  const active = threads.find((thread) => thread.id === personId) || threads[0];
  const person = profiles[active.id];
  const messages = conversations[active.id] || [];
  const [draft, setDraft] = useState('');
  const log = useRef(null);
  const available = getPerfumes([...new Set([
    ...options.saved, 'arbo-atlantica', 'insensatez', 'boticario-zaad-santal',
    'tom-ford-tobacco-vanille', 'maison-margiela-jazz-club', 'tom-ford-oud-wood',
  ])]);

  useEffect(() => {
    const area = log.current;
    if (area) area.scrollTop = area.scrollHeight;
  }, [active.id, messages.length]);

  function send(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    append(active.id, { kind: 'text', text });
    setDraft('');
  }

  function suggestion(id) {
    const [perfume] = getPerfumes([id]);
    return perfume && (
      <button className="chat-suggestion" onClick={() => options.onOpen(perfume.id)}>
        <span><small>{perfume.brand}</small><strong>{perfume.name}</strong></span><ArrowUpRight size={17} />
      </button>
    );
  }

  return (
    <section className="container page-section inbox">
      <button className="text-button" onClick={() => navigate('comunidade')}><ArrowLeft size={16} /> Comunidade</button>
      <header className="page-heading">
        <h1>Conversas</h1>
        <p>Troque indicações em conversas demonstrativas. As mensagens ficam neste navegador.</p>
      </header>
      <div className="chat-board">
        <nav className="chat-people" aria-label="Conversas disponíveis">
          {threads.map((thread) => (
            <button key={thread.id} aria-current={active.id === thread.id ? 'page' : undefined} onClick={() => { setDraft(''); navigate('conversas', thread.id, { scroll: false }); }}>
              <Avatar person={profiles[thread.id]} /><span><strong>{profiles[thread.id].name}</strong><small>{thread.note}</small></span>
            </button>
          ))}
        </nav>
        <section className="chat-thread" aria-label={`Conversa com ${person.name}`}>
          <header>
            <button className="post-author" onClick={() => navigate('perfil', active.id)}><Avatar person={person} /><span><strong>{person.name}</strong><small>Ver perfil</small></span><ArrowUpRight size={16} /></button>
          </header>
          <div className="chat-log" role="log" aria-label="Histórico da conversa" ref={log}>
            <div className="chat-message"><p>{active.opener}</p>{suggestion(active.perfume)}</div>
            {messages.map((message, index) => (
              <div className="chat-message outgoing" key={index}>
                {message.kind === 'perfume' ? suggestion(message.id) : <p>{message.text}</p>}
              </div>
            ))}
          </div>
          <div className="chat-composer">
            {available.length > 0 && <SelectMenu className="dropdown-up" label="Indicar perfume" value="" options={[{ value: '', label: 'Indicar perfume' }, ...available.map((item) => ({ value: item.id, label: item.name }))]} onChange={(id) => { if (id) append(active.id, { kind: 'perfume', id }); }} />}
            <form onSubmit={send}>
              <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={350} placeholder="Mensagem" aria-label="Mensagem" />
              <button className="icon-button" aria-label="Enviar mensagem" disabled={!draft.trim()}><Send size={17} /></button>
            </form>
          </div>
        </section>
      </div>
    </section>
  );
}
