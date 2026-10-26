/**
 * Shared client-side form handling for reservation + contact forms.
 * Forms are front-end only: wire up `submitToServer` to Formspree, Netlify Forms, an API route, etc.
 * (see README → "Making forms send real emails").
 */
type Rule = (value: string, form: HTMLFormElement) => string | null;

const email: Rule = (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? null : 'Please enter a valid email address.');
const phone: Rule = (v) => (v.replace(/\D/g, '').length >= 7 ? null : 'Please enter a valid phone number.');
const required = (label: string): Rule => (v) => (v.trim() ? null : `${label} is required.`);

const rules: Record<string, Rule[]> = {
  name: [required('Your name'), (v) => (v.trim().length >= 2 ? null : 'Please enter your full name.')],
  email: [required('Email'), email],
  phone: [required('Phone'), phone],
  date: [required('Please choose a date')],
  time: [required('Please choose a time')],
  topic: [required('Please choose a topic')],
  message: [required('A message'), (v) => (v.trim().length >= 10 ? null : 'Tell us a little more (10+ characters).')],
};

export function setError(field: HTMLElement | null, message: string | null) {
  if (!field) return;
  const err = field.querySelector<HTMLElement>('.error');
  const input = field.querySelector<HTMLElement>('input:not([type=radio]), select, textarea');
  field.classList.toggle('has-error', !!message);
  if (err) err.textContent = message ?? '';
  input?.setAttribute('aria-invalid', String(!!message));
}

export function validateField(form: HTMLFormElement, name: string): boolean {
  const field = form.querySelector<HTMLElement>(`[data-field="${name}"]`);
  if (!field) return true;
  const el = form.elements.namedItem(name) as RadioNodeList | HTMLInputElement | null;
  const value = el && 'value' in el ? String(el.value) : '';
  for (const rule of rules[name] ?? []) {
    const msg = rule(value, form);
    if (msg) { setError(field, msg); return false; }
  }
  setError(field, null);
  return true;
}

export function attachForm(form: HTMLFormElement, onValid: (data: Record<string, string>) => void, extra?: (name: string, form: HTMLFormElement) => string | null) {
  const names = Array.from(form.querySelectorAll<HTMLElement>('[data-field]')).map((f) => f.dataset.field!);
  const check = (name: string) => {
    const ok = validateField(form, name);
    if (ok && extra) { const msg = extra(name, form); if (msg) { setError(form.querySelector(`[data-field="${name}"]`), msg); return false; } }
    return ok;
  };
  names.forEach((n) => {
    const field = form.querySelector<HTMLElement>(`[data-field="${n}"]`)!;
    field.addEventListener('focusout', () => { if ((field.querySelector('input,select,textarea') as HTMLInputElement | null)?.value) check(n); });
    field.addEventListener('input', () => { if (field.classList.contains('has-error')) check(n); });
    field.addEventListener('change', () => { if (field.classList.contains('has-error')) check(n); });
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const hp = form.querySelector<HTMLInputElement>('input[name=website]');
    if (hp?.value) return; // honeypot caught a bot
    const results = names.map(check);
    const firstBad = names.find((_, i) => !results[i]);
    if (firstBad) {
      form.querySelector<HTMLElement>(`[data-field="${firstBad}"] input, [data-field="${firstBad}"] select, [data-field="${firstBad}"] textarea`)?.focus();
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    onValid(data);
  });
}
