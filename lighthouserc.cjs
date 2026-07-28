const authCookie = process.env.LHCI_AUTH_COOKIE || '';

module.exports = {
  ci: {
    collect: {
      url: ['http://127.0.0.1:4176/'],
      numberOfRuns: 2,
      settings: {
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices'],
        disableStorageReset: true,
        extraHeaders: authCookie ? { Cookie: authCookie } : {}
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.75, aggregationMethod: 'median' }],
        'categories:accessibility': ['error', { minScore: 0.9, aggregationMethod: 'median' }],
        'categories:best-practices': ['warn', { minScore: 0.85, aggregationMethod: 'median' }],
        'color-contrast': ['error', { minScore: 1 }],
        'document-title': ['error', { minScore: 1 }],
        'html-has-lang': ['error', { minScore: 1 }]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: 'artifacts/lighthouse'
    }
  }
};
