import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, Check, ChevronDown, Droplets, FlaskConical, Heart, MessageCircle, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { families, media, normalize, posts, profiles } from './editorial';
import { findNote, noteGroups, notes as libraryNotes } from './data/notes.mjs';
import SelectMenu from './SelectMenu';

export function Avatar({ person, className = '' }) {
  return <img className={`avatar ${className}`} src={media(person.image)} alt="" width="48" height="48" />;
}

function NoteIcon({ note, size = 44 }) {
  return note?.image
    ? <img className="note-icon" src={`./${note.image}`} alt="" loading="lazy" width={size} height={size} />
    : <Droplets className="note-placeholder" size={Math.min(22, size)} strokeWidth={1.3} />;
}

function NoteButton({ label, note = findNote(label), onClick }) {
  return <button className="note-button" onClick={onClick}><NoteIcon note={note} /><span>{label}</span></button>;
}

function PerfumeImage({ perfume }) {
  const [failed, setFailed] = useState(false);
  return perfume.image && !failed
    ? <img src={`./${perfume.image.replace(/^\.\//, '')}`} alt={`Frasco de ${perfume.name}`} width="360" height="280" loading="lazy" onError={() => setFailed(true)} />
    : <span className="no-photo"><FlaskConical size={29} strokeWidth={1} /><span>Sem foto</span></span>;
}

export function PerfumeCard({ perfume, saved, onSave, onOpen }) {
  return (
    <article className="perfume-card reveal">
      <button className="perfume-open" onClick={() => onOpen(perfume.id)}>
        <span className="perfume-image"><PerfumeImage perfume={perfume} /></span>
        <span className="perfume-meta">
          <span className="eyebrow">{perfume.brand}</span>
          <span className="perfume-name">{perfume.name}<ArrowUpRight size={18} aria-hidden="true" /></span>
          <span className="muted">{perfume.family || perfume.accords?.slice(0, 2).join(' · ') || perfume.concentration || 'Ver ficha'}</span>
        </span>
      </button>
      <button type="button" className="icon-button card-bookmark" aria-label={`${saved ? 'Remover da coleção' : 'Salvar'} · ${perfume.name}`} aria-pressed={saved} onClick={() => onSave(perfume.id)}>
        <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />
      </button>
    </article>
  );
}

export function PerfumeGrid({ items, saved, onSave, onOpen }) {
  return <div className="perfume-grid">{items.map((item) => <PerfumeCard key={item.id} perfume={item} saved={saved.includes(item.id)} onSave={onSave} onOpen={onOpen} />)}</div>;
}

export function SectionHeading({ label, title, children, description }) {
  return (
    <div className="section-heading reveal">
      <div>
        {label && <p className="eyebrow">{label}</p>}
        <h2>{title}</h2>
        {description && <p className="muted section-description">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function Home({ options, featured, navigate, startTour }) {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-photo" data-parallax=".13" />
        <div className="hero-veil" />
        <div className="hero-content">
          <p className="eyebrow hero-enter">PERFUMARIA & DESCOBERTA</p>
          <h1 id="hero-title" className="hero-enter">O que fica<br />na sua pele<span>?</span></h1>
          <p className="hero-intro hero-enter">Explore fragrâncias, encontre suas notas favoritas e guarde os perfumes que contam a sua história.</p>
          <div className="hero-actions hero-enter">
            <button className="button button-light" onClick={() => navigate('explorar')}>Explorar perfumes <ArrowRight size={17} /></button>
            <button className="button button-glass" onClick={startTour}>Como funciona <ArrowUpRight size={15} /></button>
          </div>
        </div>
        <button className="hero-scroll icon-button" aria-label="Rolar para descobertas" onClick={() => document.getElementById('descobertas').scrollIntoView({ block: 'start' })}><ArrowDown size={19} /></button>
      </section>
      <section className="container home-section" id="descobertas">
        <SectionHeading label="CATÁLOGO" title="Para descobrir">
          <button className="text-button" onClick={() => navigate('explorar')}>Ver catálogo <ArrowUpRight size={17} /></button>
        </SectionHeading>
        <PerfumeGrid items={featured.slice(0, 3)} {...options} />
      </section>
      <section className="container home-section">
        <SectionHeading label="BIBLIOTECA" title="O cheiro tem família.">
          <button className="text-button" onClick={() => navigate('biblioteca')}>Explorar famílias <ArrowUpRight size={17} /></button>
        </SectionHeading>
        <div className="family-strip">
          {families.slice(0, 4).map((family) => (
            <button key={family.id} className="family-tile reveal" style={{ '--family': family.color }} onClick={() => navigate('biblioteca', family.id)}>
              <img src={media(`family-${family.id}.webp`)} alt="" width="230" height="230" loading="lazy" />
              <span>{family.name}<ArrowUpRight size={17} /></span>
            </button>
          ))}
        </div>
      </section>
      <section className="container home-section">
        <div className="profile-feature reveal">
          <img src={media('vincenzo.webp')} alt="" width="260" height="260" loading="lazy" />
          <div>
            <p className="eyebrow">PERFIL DEMONSTRATIVO</p>
            <h2>Vincenzo Saggio</h2>
            <p>Alfaiataria de outra época. Discos que ficam.<br />Perfumes com história.</p>
            <button className="button button-dark" onClick={() => navigate('perfil', 'vincenzo')}>Ver perfil <ArrowUpRight size={16} /></button>
          </div>
        </div>
      </section>
    </>
  );
}

export function Explore({ items, pending, failed, featured, query, setQuery, filter, setFilter, options }) {
  const [limit, setLimit] = useState(24);
  const search = normalize(query);
  const terms = search.split(/\s+/).filter(Boolean);
  const brands = useMemo(() => {
    const brandsByKey = new Map();
    for (const item of items) {
      const key = normalize(item.brand);
      if (key && !key.includes('boticario') && !brandsByKey.has(key)) {
        brandsByKey.set(key, { value: key, label: item.brand });
      }
    }
    return [
      { value: 'todos', label: 'Todas as marcas' },
      { value: 'boticario', label: 'O Boticário' },
      ...[...brandsByKey.values()].sort((first, second) => first.label.localeCompare(second.label, 'pt-BR')),
    ];
  }, [items]);
  const matching = items.filter((item) =>
    (filter === 'todos' || (filter === 'boticario' ? normalize(item.brand).includes('boticario') : normalize(item.brand) === filter))
    && terms.every((term) => item.searchText.includes(term)),
  );
  const isDefault = !search && filter === 'todos';
  const visible = isDefault ? [
    ...featured, ...matching.filter((item) => !featured.some((entry) => entry.id === item.id)),
  ] : matching;

  return (
    <section className="container page-section">
      <header className="page-heading">
        <p className="eyebrow">CATÁLOGO</p>
        <h1>Explorar perfumes</h1>
        <p>Encontre uma fragrância pelo nome, pela marca ou pelo que ela deixa na pele.</p>
      </header>
      <div className="catalog-controls">
        <label className="search-box">
          <Search size={20} />
          <input type="search" value={query} placeholder="Buscar perfume, marca, nota ou acorde" aria-label="Buscar perfume, marca, nota ou acorde" onChange={(event) => { setQuery(event.target.value); setLimit(24); }} />
          {query && <button type="button" className="icon-button" aria-label="Limpar busca" onClick={() => { setQuery(''); setLimit(24); }}><X size={17} /></button>}
        </label>
        <SelectMenu label="Marca" value={filter} options={brands} onChange={(value) => { setFilter(value); setLimit(24); }} />
      </div>
      <p className="eyebrow result-count" aria-live="polite">{pending ? 'CARREGANDO CATÁLOGO' : `${visible.length.toLocaleString('pt-BR')} FRAGRÂNCIAS`}</p>
      {failed && <p className="empty">O catálogo ficou indisponível. Recarregue a página para tentar novamente.</p>}
      {!pending && !failed && visible.length === 0 && <p className="empty">Nenhum perfume encontrado para essa busca.</p>}
      <PerfumeGrid items={visible.slice(0, limit)} {...options} />
      {visible.length > limit && <div className="more"><button className="button button-outline" onClick={() => setLimit((current) => current + 24)}>Carregar mais <ChevronDown size={18} /></button></div>}
    </section>
  );
}

export function Library({ familyId, navigate, searchFor }) {
  const selected = families.find((family) => family.id === familyId);
  const [noteQuery, setNoteQuery] = useState('');
  const [group, setGroup] = useState('');
  const [limit, setLimit] = useState(24);
  const groups = [{ value: '', label: 'Todos os grupos' }, ...noteGroups.map((name) => ({ value: name, label: name }))];
  const matches = libraryNotes.filter((note) => (!group || note.group === group) && normalize([note.name, ...(note.aliases || [])].join(' ')).includes(normalize(noteQuery)));
  return (
    <section className="container page-section">
      <header className="page-heading">
        <p className="eyebrow">BIBLIOTECA OLFATIVA</p>
        <h1>Notas e famílias</h1>
        <p>Escolha uma família para conhecer suas notas e descobrir onde elas aparecem.</p>
      </header>
      <div className="family-strip library-grid">
        {families.map((family) => (
          <button className="family-tile reveal" key={family.id} style={{ '--family': family.color }} aria-pressed={selected?.id === family.id} onClick={() => navigate('biblioteca', family.id, { scroll: false })}>
            <img src={media(`family-${family.id}.webp`)} alt="" width="230" height="230" loading="lazy" />
            <span>{family.name}<ArrowUpRight size={17} /></span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="library-notes" key={selected.id}>
          <div><p className="eyebrow">{selected.words}</p><h2>{selected.name}</h2></div>
          <div className="illustrated-notes">
            {selected.notes.map((note) => <NoteButton key={note} label={note} onClick={() => searchFor(note)} />)}
          </div>
          <button className="text-button" onClick={() => searchFor(selected.search)}>Buscar por família <ArrowUpRight size={15} /></button>
        </div>
      )}
      <div className="library-catalog">
        <SectionHeading title="Notas do acervo" />
        <div className="catalog-controls">
          <label className="search-box"><Search size={19} /><input type="search" aria-label="Buscar nota" placeholder="Buscar nota" value={noteQuery} onChange={(event) => { setNoteQuery(event.target.value); setLimit(24); }} /></label>
          <SelectMenu label="Grupo de notas" value={group} options={groups} onChange={(value) => { setGroup(value); setLimit(24); }} />
        </div>
        <div className="note-grid">
          {matches.slice(0, limit).map((note) => <NoteButton key={note.id} label={note.name} note={note} onClick={() => searchFor(note.name)} />)}
        </div>
        {matches.length === 0 && <p className="empty">Nenhuma nota encontrada.</p>}
        {limit < matches.length && <div className="more"><button className="button button-outline" onClick={() => setLimit((current) => current + 24)}>Carregar mais notas <ChevronDown size={17} /></button></div>}
      </div>
    </section>
  );
}

export function Community({ navigate, follows, likes, toggleLike, bookmarks, toggleBookmark, comments, addComment, onOpen }) {
  const [filter, setFilter] = useState('todos');
  const [activeComment, setActiveComment] = useState(null);
  const visible = posts.filter((post) => (filter !== 'seguindo' || follows.includes(post.author)) && (filter !== 'salvos' || bookmarks.includes(post.id)));

  const submit = (event, id) => {
    event.preventDefault();
    const body = new FormData(event.currentTarget).get('comment').trim();
    if (body) {
      addComment(id, body);
      event.currentTarget.reset();
    }
  };

  return (
    <section className="container page-section">
      <header className="page-heading">
        <p className="eyebrow">COMUNIDADE DEMONSTRATIVA</p>
        <h1>Perfumes nas entrelinhas</h1>
        <p>Um feed simulado com curadorias inspiradas no jeito de sentir de cada perfil.</p>
        <div className="community-links">
          <button className="button button-dark" onClick={() => navigate('conversas')}><MessageCircle size={17} /> Chat</button>
          <button className="button button-outline" onClick={() => navigate('ferramentas', 'today')}>Indicações <ArrowUpRight size={17} /></button>
        </div>
      </header>
      <div className="stories">
        {Object.entries(profiles).map(([id, person]) => (
          <button className="story" key={id} onClick={() => navigate('perfil', id)}>
            <Avatar person={person} />
            <span>{person.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>
      <div className="chips feed-tabs" aria-label="Filtrar feed">
        {[['todos', 'Para você'], ['seguindo', 'Seguindo'], ['salvos', 'Salvos']].map(([id, label]) => <button className="chip" key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}
      </div>
      {visible.length === 0 && <p className="empty">{filter === 'seguindo' ? 'Siga um dos perfis acima para encontrar publicações aqui.' : 'Os posts que você salvar aparecem aqui.'}</p>}
      <div className="feed-grid">
        {visible.map((post) => {
          const person = profiles[post.author];
          const liked = likes.includes(post.id);
          const bookmarked = bookmarks.includes(post.id);
          return (
            <article className="post reveal" key={post.id}>
              <button className="post-author" onClick={() => navigate('perfil', post.author)}><Avatar person={person} /><span><strong>{person.name}</strong><small>@{person.handle}</small></span></button>
              <div className="post-photo" style={{ backgroundColor: post.tone }}>
                <img src={media(post.image)} alt="" width="600" height="500" loading="lazy" />
                <button className="icon-button" aria-label="Ver perfume da publicação" onClick={() => onOpen(post.perfume)}><ArrowUpRight size={19} /></button>
              </div>
              <div className="post-body">
                <div className="post-actions">
                  <button className="icon-button" aria-label="Curtir publicação" aria-pressed={liked} onClick={() => toggleLike(post.id)}><Heart size={19} fill={liked ? 'currentColor' : 'none'} /></button>
                  <button className="icon-button" aria-label="Mostrar comentários" aria-expanded={activeComment === post.id} onClick={() => setActiveComment(activeComment === post.id ? null : post.id)}><MessageCircle size={19} /></button>
                  <button className="icon-button" aria-label="Salvar publicação" aria-pressed={bookmarked} onClick={() => toggleBookmark(post.id)}><Bookmark size={19} fill={bookmarked ? 'currentColor' : 'none'} /></button>
                </div>
                <h2>{post.title}</h2><p>{post.text}</p>
                {activeComment === post.id && (
                  <div className="comments">
                    {(comments[post.id] || []).map((comment, index) => <p key={index}><strong>Você</strong> {comment}</p>)}
                    <form onSubmit={(event) => submit(event, post.id)}>
                      <input name="comment" aria-label="Seu comentário" placeholder="Escreva um comentário" maxLength={220} required />
                      <button type="submit" className="icon-button" aria-label="Enviar comentário"><ArrowRight size={18} /></button>
                    </form>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function Profile({ person, personId, isFollowing, toggleFollow, notify, picks, options, searchFor, navigate }) {
  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify('Link do perfil copiado.');
    } catch {
      notify('Copie o endereço deste perfil na barra do navegador.');
    }
  }

  return (
    <section className="container page-section profile-page">
      <div className="profile-navigation">
        <button className="text-button" onClick={() => navigate('comunidade')}><ArrowLeft size={16} /> Comunidade</button>
        <button className="text-button" onClick={() => navigate('ferramentas', 'profile')}>Meu perfil <ArrowUpRight size={16} /></button>
      </div>
      <div className="profile-card reveal">
        <div className="profile-person">
          <Avatar person={person} />
          <div className="profile-intro">
            <p className="muted profile-handle">@{person.handle}</p>
            <h1>{person.name}</h1>
            <p className="profile-role">{person.role} <span>· Perfil demonstrativo</span></p>
            <p className="profile-bio">{person.bio}</p>
            <div className="profile-actions">
              <button className="button button-dark" aria-pressed={isFollowing} onClick={() => toggleFollow(personId)}>{isFollowing ? <Check size={16} /> : <span aria-hidden="true">+</span>}{isFollowing ? 'Seguindo' : 'Seguir'}</button>
              <button className="icon-button" aria-label="Copiar link do perfil" onClick={share}><ArrowUpRight size={19} /></button>
            </div>
          </div>
        </div>
        <div className="profile-notes">
          <p className="eyebrow">AS TRÊS NOTAS QUE FICAM</p>
          <div className="note-row">
            {person.notes.map(([name, file]) => <button key={name} onClick={() => searchFor(name)}><img src={media(file)} alt="" width="106" height="96" /><span>{name}</span></button>)}
          </div>
          <p className="muted">Um retrato do seu universo olfativo.</p>
        </div>
      </div>
      <div className="profile-picks">
        <SectionHeading label="NA ESTANTE" title="Três perfumes para conhecer" />
        <PerfumeGrid items={picks} {...options} />
      </div>
    </section>
  );
}

export function Collection({ items, options, navigate }) {
  return (
    <section className="container page-section">
      <header className="page-heading">
        <p className="eyebrow">MINHA ESTANTE</p>
        <h1>Minha coleção</h1>
        <p>As fragrâncias que você salvou neste navegador.</p>
        <button className="text-button" onClick={() => navigate('ferramentas', 'collection')}>Organizar listas <ArrowUpRight size={15} /></button>
      </header>
      {items.length > 0 ? <PerfumeGrid items={items} {...options} /> : (
        <div className="collection-empty"><Bookmark size={31} strokeWidth={1} /><h2>Sua coleção começa por um perfume.</h2><p>Toque em salvar no catálogo para guardar uma fragrância aqui.</p><button className="button button-dark" onClick={() => navigate('explorar')}>Explorar perfumes <ArrowRight size={17} /></button></div>
      )}
    </section>
  );
}

export function PerfumeDetail({ perfume, saved, toggleSave, searchFor, rating, setRating }) {
  const [showEditorial, setShowEditorial] = useState(false);
  const pyramid = [['Saída', perfume.pyramid?.top], ['Coração', perfume.pyramid?.heart], ['Fundo', perfume.pyramid?.base]].filter(([, notes]) => notes?.length);
  const layered = new Set(pyramid.flatMap(([, notes]) => notes.map(normalize)));
  const highlights = (perfume.notes || []).filter((note) => !layered.has(normalize(note)));
  const ratingOptions = [{ value: '', label: 'Sem avaliação' }, ...Array.from({ length: 11 }, (_, value) => ({ value: String(value), label: `${value} de 10` }))];
  return (
    <div className="detail-content">
      <div className="detail-photo">
        {showEditorial ? <img className="campaign-photo" src={`./${perfume.editorialImage}`} alt={`Campanha oficial de ${perfume.name}`} width="360" height="360" /> : <PerfumeImage perfume={perfume} />}
        {perfume.editorialImage && <button className="image-switch" onClick={() => setShowEditorial((current) => !current)}>{showEditorial ? 'Ver frasco' : 'Ver campanha'}</button>}
      </div>
      <div className="detail-information">
        <p className="eyebrow">{perfume.brand}</p>
        <h2 id="perfume-title">{perfume.name}</h2>
        <p className="muted">{[perfume.concentration, perfume.family].filter(Boolean).join(' · ')}</p>
        {perfume.description && <p>{perfume.description}</p>}
        <button className="button button-dark" aria-pressed={saved} onClick={() => toggleSave(perfume.id)}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Salvo na coleção' : 'Salvar na coleção'}</button>
      </div>
      <section className="detail-notes">
        <h3><Droplets size={17} /> Notas olfativas</h3>
        {pyramid.map(([label, notes]) => <div className="pyramid" key={label}><strong>{label}</strong><div className="illustrated-notes">{notes.map((note) => <NoteButton key={note} label={note} onClick={() => searchFor(note)} />)}</div></div>)}
        {highlights.length > 0 && <div className="pyramid"><strong>Destaques</strong><div className="illustrated-notes">{highlights.map((note) => <NoteButton key={note} label={note} onClick={() => searchFor(note)} />)}</div></div>}
        {pyramid.length === 0 && highlights.length === 0 && <p>Notas ainda sem confirmação no catálogo.</p>}
        {perfume.accords?.length > 0 && <>
          <h3>Acordes {perfume.accordSource === 'editorial' && <span className="muted">· Leitura editorial</span>}</h3>
          <div className="chips">{perfume.accords.map((name) => <button className="chip" key={name} onClick={() => searchFor(name)}>{name} <ArrowUpRight size={13} /></button>)}</div>
        </>}
        <div className="rating"><span>Minha avaliação</span>
          <SelectMenu className="dropdown-up" label="Minha avaliação" value={rating ?? ''} options={ratingOptions} onChange={(value) => setRating(perfume.id, value)} />
        </div>
        {perfume.source && <a className="text-button source-link" href={perfume.source} target="_blank" rel="noreferrer">Consultar fonte {perfume.sourceType === 'marca' ? 'da marca' : 'do catálogo'} <ArrowUpRight size={15} /></a>}
      </section>
    </div>
  );
}

export function useNativeDialog(dialog, open, onClose) {
  useEffect(() => {
    const element = dialog.current;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [dialog, open]);

  return {
    onCancel: (event) => { event.preventDefault(); onClose(); },
    onClick: (event) => { if (event.target === event.currentTarget) onClose(); },
  };
}
