import { writeFile } from 'fs/promises';
import { stringify } from 'yaml'

/**
 * Writes the given metadata to the given file path.
 * @param filePath The path to write the metadata to
 * @param metadata The metadata to write
 * @returns A promise that resolves when the metadata has been written
 */
export async function writeMetadata(filePath: string, metadata: any) {
    const metadataPath = filePath + ".yaml"
    const metadataContent = stringify(metadata)
    await writeFile(metadataPath, metadataContent, { encoding: 'utf8' })
}

/**
 * Writes the given document to the given file path.
 * @param filePath The path to write the document to
 * @param document The document to write
 * @returns A promise that resolves when the document has been written
 */
export async function writeDocument(filePath: string, document: Document) {
    const content = document.documentElement.outerHTML.replace(/&quot;/g, '');
    await writeFile(filePath, content, { encoding: 'utf8' })
}
