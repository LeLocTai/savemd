import OptionsSync from 'webext-options-sync';

const defaults = {
    mdPath: 'Documents/Notes/',
    imgPath: 'Documents/Notes/_resources/{title}/',
}

export type Options = typeof defaults

export default new OptionsSync({
    defaults,
    migrations: [
        OptionsSync.migrations.removeUnused,
    ],
    logging: true,
});
