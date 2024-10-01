import { readFile } from 'fs/promises';

// @ts-ignore, https://github.com/svgdotjs/svgdom/issues/69
import { createSVGDocument, HTMLParser } from 'svgdom';
import { parse } from 'yaml'

import { JsonObject } from './misc';

export class Template {
    public readonly path: string
    public readonly metadata: JsonObject
    private readonly content: string
    private readonly document: Document
    public constructor(path: string, content: string) {
        this.path = path
        this.content = content
        this.document = createSVGDocument()
        HTMLParser(this.content, this.document)
        const firstNode = this.document.firstChild
        if (firstNode !== null && firstNode.nodeType === Node.COMMENT_NODE && firstNode.textContent) {
            this.metadata = parse(firstNode.textContent)
        } else {
            this.metadata = {}
        }
    }
    public async fromFile(path: string) {
        return new Template(path, await readFile(path, { encoding: 'utf8' }))
    }
    public cloneDocument(): Document {
        return this.document.cloneNode(true) as Document
    }
}

interface TemplateMetadata {
    name?: string
    tags?: string[]
    license?: string
    sources?: TemplateSource[]
}

interface TemplateSource {
    name?: string
    url?: string
}
