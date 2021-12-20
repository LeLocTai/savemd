import { md5 } from "./lib/md5.js";

export function ensureTrailingSlash(path: string)
{
    if (path[path.length - 1] != '/') path += '/'

    return path
}

export function shortenName(name: string, maxLength: number): string
{
    if (name.length <= maxLength)
        return name

    const hashLength = 6
    const shortenedLength = maxLength - hashLength - 1
    const hash = md5(name).slice(hashLength)

    return name.substring(0, shortenedLength) + '_' + hash
}