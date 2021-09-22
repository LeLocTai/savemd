import OptionsSync from 'webext-options-sync';

const defaults = {
    mdPath: 'Documents/Notes/Web Clips/{title}.md',
    imgPath: 'Documents/Notes/_resources/{shortTitle}/',
    frontMatter: `---
    tags: []
    source: {url}
    created: {date}
---

`
}

export type Options = typeof defaults

export default new OptionsSync({
    defaults,
    migrations: [
        OptionsSync.migrations.removeUnused,
    ],
    logging: true,
});
