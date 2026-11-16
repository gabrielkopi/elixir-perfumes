import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import './profile-card.css';

const drop = 'M55.3 3.8C57.6 3.8 58.9 5.9 59.2 9.1C65.2 77.5 76.4 108.1 103.1 149.4C119.8 175.2 127 191.2 127 208.8C127 248.7 95.4 274 57.3 274C19.2 274-12 247.9-12 208.8C-12 191.5-5.6 175.4 11.3 149.4C38 108.2 45.5 77.5 51.4 9.1C51.7 5.9 53 3.8 55.3 3.8Z';

function Drop({ className }) {
  return (
    <svg className={className} viewBox="-12 0 139 277" aria-hidden="true">
      <path d={drop} fill="currentColor" />
    </svg>
  );
}

function Verified() {
  return (
    <svg className="elx-profile-card__verified" viewBox="0 0 24 24" role="img" aria-label="Selo de verificado">
      <path d="M12 1.75 14.74 4l3.51-.03 1.03 3.35 2.87 2.02-1.12 3.33.45 3.47-3.15 1.55-1.59 3.13-3.47-.42-3.32 1.17-2.05-2.85-3.36-.98-.02-3.51-2.28-2.69L4.1 8.59l.2-3.5 3.42-.8 2.19-2.74Z" fill="currentColor" />
      <path d="m8 11.8 2.6 2.65 5.35-5.4" fill="none" stroke="var(--card-paper)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
    </svg>
  );
}

function Motif({ name, note, className }) {
  if (name === 'none') return null;

  if (name === 'stars') {
    return (
      <svg className={className} viewBox="0 0 240 240" fill="none" aria-hidden="true">
        <path d="M121 20q7 80 78 100-72 18-78 99-13-82-81-99 70-19 81-100ZM30 43q2 21 19 26-18 5-19 26-4-22-21-26 17-4 21-26ZM201 163q4 26 26 32-23 7-26 35-4-29-25-35 21-6 25-32Z" stroke="currentColor" strokeWidth="1.25" />
        <circle cx="205" cy="59" r="3" fill="currentColor" />
        <circle cx="57" cy="192" r="2" fill="currentColor" />
      </svg>
    );
  }

  if (name === 'orbit') {
    return (
      <svg className={className} viewBox="0 0 240 240" fill="none" aria-hidden="true">
        <ellipse cx="120" cy="120" rx="109" ry="53" transform="rotate(-43 120 120)" stroke="currentColor" strokeWidth="1" />
        <ellipse cx="120" cy="120" rx="109" ry="53" transform="rotate(43 120 120)" stroke="currentColor" strokeWidth="1" />
        <circle cx="120" cy="120" r="76" stroke="currentColor" strokeWidth=".7" strokeDasharray="2 5" />
        <circle cx="59" cy="189" r="4" fill="currentColor" />
        <circle cx="174" cy="66" r="3" fill="currentColor" />
      </svg>
    );
  }

  if (note?.art) return <img className={className} src={note.art} alt="" draggable="false" />;

  return (
    <svg className={className} viewBox="0 0 240 240" fill="none" aria-hidden="true">
      <path d="M20 221c24-56 49-55 77-93s48-73 123-104M36 195c14-19 26-45 28-68 12 20 3 41-28 68ZM66 163c22-14 49-22 83-17-24 16-48 19-83 17ZM94 131c4-24-4-46-11-72 25 19 26 42 11 72ZM110 110c20-12 55-19 93-16-28 20-63 24-93 16ZM135 81c4-22 3-38 19-60-1 26-7 42-19 60ZM161 60c16-22 35-37 59-36-16 16-32 26-59 36Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function nameLayout(name, type, format) {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return { lines: ['Seu nome'], size: 9.4 };

  const characterWidth = { serif: .54, sans: .58, mono: .62 }[type] || .54;
  const fullNameWidth = Array.from(words.join(' ')).length * characterWidth;
  const compactPortrait = format === 'portrait' && fullNameWidth * 11.5 <= 80;
  const split = compactPortrait ? words.length : Math.ceil(words.length / 2);
  const lines = [words.slice(0, split).join(' '), words.slice(split).join(' ')].filter(Boolean);
  const longest = Math.max(...lines.map(line => Array.from(line).length));
  const landscapeMax = lines.length > 1 ? 8.2 : 10.5;
  const portraitMax = lines.length > 1 ? 9 : 12.8;
  const maxSize = { square: 10.5, portrait: portraitMax }[format] ?? landscapeMax;
  const widthBudget = format === 'portrait' ? 80 : 48;
  return { lines, size: Math.min(maxSize, widthBudget / (characterWidth * longest)) };
}

const ProfileCard = forwardRef(function ProfileCard({ profile, notes = [], palette }, ref) {
  const element = useRef(null);
  useImperativeHandle(ref, () => element.current, []);

  useLayoutEffect(() => {
    const card = element.current;
    const updateScale = () => {
      if (card.clientWidth) card.style.setProperty('--profile-u', `${card.clientWidth / 100}px`);
    };
    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const {
    name, handle, bio, verified, photo, format = 'landscape', side = 'right', treatment = 'frame',
    motif = 'botanical', filter = 'original', zoom = 1, offsetX = 0, offsetY = 0, type = 'serif', grain,
  } = profile;
  const { lines, size } = nameLayout(name, type, format);
  const cleanHandle = (handle || '').trim().replace(/^@+/, '');
  const cardStyle = {
    '--card-paper': palette.paper,
    '--card-ink': palette.text,
    '--card-muted': palette.muted,
    '--card-accent': palette.accent,
    '--card-photo-bg': palette.photoBg,
    '--card-line': palette.line,
    '--card-name-size': size,
    '--photo-x': `${offsetX}%`,
    '--photo-y': `${offsetY}%`,
    '--photo-zoom': zoom,
  };

  return (
    <article
      ref={element}
      className="elx-profile-card"
      data-format={format}
      data-side={side}
      data-treatment={treatment}
      data-filter={filter}
      data-type={type}
      data-lines={lines.length}
      style={cardStyle}
      aria-label={name ? `Perfil de ${name}` : 'Prévia do perfil'}
    >
      {grain && <div className="elx-profile-card__grain" aria-hidden="true" />}
      <div className="elx-profile-card__identity">
        <div className="elx-profile-card__brand"><Drop /> Elixir</div>
        <div className="elx-profile-card__copy">
          <h2 className="elx-profile-card__name">
            {lines.map((line, index) => (
              <span className="elx-profile-card__name-line" key={index}>
                <span>{line}</span>
                {verified && index === lines.length - 1 && <Verified />}
              </span>
            ))}
          </h2>
          {cleanHandle && <p className="elx-profile-card__handle">@{cleanHandle}</p>}
          {bio?.trim() && <p className="elx-profile-card__bio">{bio.trim()}</p>}
        </div>
        {!!notes.length && (
          <ul className="elx-profile-card__notes" aria-label="Notas olfativas mais usadas">
            {notes.slice(0, 3).map(note => (
              <li className="elx-profile-card__note" key={note.id}>
                <span className="elx-profile-card__note-art" style={{ backgroundColor: note.paper, color: note.ink }} aria-hidden="true">
                  {note.art ? <img src={note.art} alt="" draggable="false" /> : <Drop />}
                </span>
                <span className="elx-profile-card__note-name">{note.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="elx-profile-card__visual">
        <div className="elx-profile-card__portrait">
          <div className="elx-profile-card__photomat" aria-hidden="true" />
          <Motif name={motif} note={notes[0]} className="elx-profile-card__motif" />
          {photo ? (
            <img className="elx-profile-card__photo" src={photo} alt={name ? `Retrato de ${name}` : 'Retrato do perfil'} draggable="false" />
          ) : (
            <Drop className="elx-profile-card__photo-placeholder" />
          )}
        </div>
      </div>
    </article>
  );
});

export { ProfileCard };
export default ProfileCard;
