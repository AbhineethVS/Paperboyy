// Client entry: Tailwind CSS plus small page behaviors for browse hydration and answer toggles.
import './main.css';

const PAPER_TYPE_LABELS = {
  endsem: 'End semester',
  periodic: 'Periodic',
  model: 'Model',
};

function isSafeHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

function initBrowse() {
  const root = document.getElementById('browse-page');
  if (!root) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const semesterRaw = params.get('semester');
  const semesterNum = semesterRaw !== null && semesterRaw !== '' ? Number(semesterRaw) : NaN;
  const semesterOk =
    Number.isInteger(semesterNum) && semesterNum >= 1 && semesterNum <= 8 ? semesterNum : null;
  const subjectParam = params.get('subject');
  const subject = subjectParam && subjectParam.trim() ? subjectParam.trim() : null;

  const subjectList = document.getElementById('subject-list');
  const subjectEmpty = document.getElementById('subject-empty');
  const papersList = document.getElementById('papers-list');
  const papersEmpty = document.getElementById('papers-empty');

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) {
      let message = res.statusText;
      try {
        const body = await res.json();
        if (body?.error?.message) {
          message = body.error.message;
        }
      } catch {
        // ignore
      }
      throw new Error(message);
    }
    return res.json();
  }

  if (semesterOk !== null && subjectList && subjectEmpty) {
    fetchJson(`/api/subjects?semester=${semesterOk}`)
      .then((rows) => {
        subjectList.replaceChildren();
        if (!Array.isArray(rows) || rows.length === 0) {
          subjectEmpty.textContent = 'No subjects found';
          subjectEmpty.classList.remove('hidden');
          return;
        }
        subjectEmpty.classList.add('hidden');
        for (const row of rows) {
          const card = document.createElement('button');
          card.type = 'button';
          card.className =
            'border border-neutral-900 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-neutral-900 hover:text-white';
          const codeEl = document.createElement('span');
          codeEl.className = 'block text-neutral-600';
          codeEl.textContent = `(${row.subject})`;
          const nameEl = document.createElement('span');
          nameEl.className = 'mt-1 block text-neutral-900';
          nameEl.textContent = row.subjectName || row.subject;
          card.append(codeEl, nameEl);
          card.addEventListener('click', () => {
            window.location.href = `/browse?semester=${semesterOk}&subject=${encodeURIComponent(row.subject)}`;
          });
          subjectList.appendChild(card);
        }
      })
      .catch(() => {
        subjectList.replaceChildren();
        subjectEmpty.textContent = 'Failed to load subjects';
        subjectEmpty.classList.remove('hidden');
      });
  }

  if (semesterOk !== null && subject && papersList && papersEmpty) {
    const q = new URLSearchParams({ semester: String(semesterOk), subject });
    fetchJson(`/api/papers?${q.toString()}`)
      .then((rows) => {
        papersList.replaceChildren();
        if (!Array.isArray(rows) || rows.length === 0) {
          papersEmpty.textContent = 'No papers found';
          papersEmpty.classList.remove('hidden');
          return;
        }
        papersEmpty.classList.add('hidden');
        for (const p of rows) {
          const article = document.createElement('article');
          article.className =
            'flex flex-col gap-3 border border-neutral-900 px-4 py-3 text-sm';

          const titleEl = document.createElement('div');
          titleEl.className = 'font-semibold text-neutral-900';
          titleEl.textContent = p.subjectName || p.title || '';

          const metaEl = document.createElement('div');
          metaEl.className = 'text-xs uppercase tracking-wide text-neutral-600';
          const typeKey = p.paperType;
          const typeLabel =
            typeKey && PAPER_TYPE_LABELS[typeKey] ? PAPER_TYPE_LABELS[typeKey] : typeKey || '';
          const metaParts = [];
          if (p.year != null) {
            metaParts.push(String(p.year));
          }
          if (p.month != null && String(p.month).trim()) {
            metaParts.push(String(p.month));
          }
          if (typeLabel) {
            metaParts.push(typeLabel);
          }
          metaEl.textContent = metaParts.join(' · ');

          const actions = document.createElement('div');
          if (isSafeHttpUrl(p.fileUrl)) {
            const link = document.createElement('a');
            link.href = p.fileUrl.trim();
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className =
              'inline-block border border-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide hover:bg-neutral-900 hover:text-white';
            link.textContent = 'Download';
            actions.appendChild(link);
          } else {
            const span = document.createElement('span');
            span.className = 'text-xs uppercase tracking-wide text-neutral-500';
            span.textContent = 'No file';
            actions.appendChild(span);
          }

          article.append(titleEl, metaEl, actions);
          papersList.appendChild(article);
        }
      })
      .catch(() => {
        papersList.replaceChildren();
        papersEmpty.textContent = 'Failed to load papers';
        papersEmpty.classList.remove('hidden');
      });
  }
}

function toggleAnswer(id) {
  const el = document.getElementById(`ans-${id}`) || document.getElementById(id);
  if (!el) {
    return;
  }

  if (el.style.display === 'none') {
    el.style.display = 'block';
    el.classList.remove('hidden');
    return;
  }

  if (el.style.display === 'block') {
    el.style.display = 'none';
    el.classList.add('hidden');
    return;
  }

  el.classList.toggle('hidden');
}

window.toggleAnswer = toggleAnswer;

document.addEventListener('DOMContentLoaded', initBrowse);
