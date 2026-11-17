import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

export default function SelectMenu({ label, value, options, onChange, className = '' }) {
  const id = useId();
  const root = useRef(null);
  const trigger = useRef(null);
  const list = useRef(null);
  const [active, setActive] = useState(null);
  const selected = Math.max(0, options.findIndex((option) => option.value === value));
  const open = active !== null;

  useEffect(() => {
    if (!open) return;
    list.current?.focus({ preventScroll: true });
    const closeOutside = (event) => {
      if (!root.current?.contains(event.target)) setActive(null);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);

  useEffect(() => {
    if (active === null) return;
    const option = list.current?.children[active];
    if (!option) return;
    const region = list.current;
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < region.scrollTop) region.scrollTop = top;
    if (bottom > region.scrollTop + region.clientHeight) region.scrollTop = bottom - region.clientHeight;
  }, [active]);

  function choose(index) {
    onChange(options[index].value);
    setActive(null);
    trigger.current?.focus({ preventScroll: true });
  }

  function handleListKey(event) {
    switch (event.key) {
      case 'ArrowDown':
        setActive((index) => Math.min(index + 1, options.length - 1));
        break;
      case 'ArrowUp':
        setActive((index) => Math.max(0, index - 1));
        break;
      case 'Home':
        setActive(0);
        break;
      case 'End':
        setActive(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        choose(active);
        break;
      case 'Escape':
        event.stopPropagation();
        setActive(null);
        trigger.current?.focus({ preventScroll: true });
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  return (
    <div className={`dropdown ${className}`} ref={root} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setActive(null);
    }}>
      <button
        className="dropdown-trigger"
        type="button"
        ref={trigger}
        aria-label={`${label}: ${options[selected].label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setActive(open ? null : selected)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setActive(selected);
          }
        }}
      ><span>{options[selected].label}</span><ChevronDown size={15} /></button>
      {open && <div
        className="dropdown-options"
        id={id}
        role="listbox"
        aria-label={label}
        aria-activedescendant={`${id}-${active}`}
        tabIndex={-1}
        ref={list}
        onKeyDown={handleListKey}
      >
        {options.map((option, index) => (
          <div key={option.value} id={`${id}-${index}`} role="option" aria-selected={index === selected} data-active={index === active} onPointerMove={(event) => { if (event.pointerType === 'mouse' && index !== active) setActive(index); }} onPointerDown={(event) => event.preventDefault()} onClick={() => choose(index)}>
            <span>{option.label}</span>{index === selected && <Check size={15} />}
          </div>
        ))}
      </div>}
    </div>
  );
}
