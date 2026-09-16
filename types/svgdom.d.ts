declare module 'svgdom' {
    export function createDocument(namespace: string | null, qualifiedName?: string | null, doctype?: DocumentType | null,): Document;
    export function createSVGDocument(): Document;
    export function HTMLParser<T extends Document | Element>(str: string, el: T): T;
}
