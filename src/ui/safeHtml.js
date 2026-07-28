import DOMPurify from 'dompurify';

const SANITIZE_OPTIONS = Object.freeze({
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'template'],
    FORBID_ATTR: ['srcdoc', 'style'],
    ALLOW_DATA_ATTR: true,
    ALLOW_ARIA_ATTR: true
});

export function sanitizeHtml(html) {
    return DOMPurify.sanitize(String(html ?? ''), SANITIZE_OPTIONS);
}

export function setSafeHtml(element, html) {
    if (element)
        element.innerHTML = sanitizeHtml(html);
}
