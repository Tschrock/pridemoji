// @ts-ignore, https://github.com/svgdotjs/svgdom/issues/69
import { createSVGDocument, HTMLParser } from 'svgdom';
import { toFixedUnpadded } from './misc';

/**
 * Parses an SVG string into a document.
 * @param svg The SVG string to parse
 * @returns The parsed document
 */
export function parseSvg(svg: string): Document {
    const document = createSVGDocument();
    HTMLParser(svg, document);
    return document;
}

/**
 * Fills a container with stripes of the given colors.
 * @param document The document to modify
 * @param stripeContainerSelector The selector for the container to fill with stripes
 * @param stripeColors The colors to use for the stripes
 * @param stripeAngle The angle of the stripes in degrees
 */
export function fillStripes(document: Document, stripeContainerSelector: string, stripeColors: string[], stripeAngle: number) {
    const stripeContainer = document.querySelector(stripeContainerSelector);
    if (!stripeContainer) {
        throw new Error(`No element found with selector ${stripeContainerSelector}`);
    }

    // Rotate the container
    stripeContainer.setAttribute('transform', `rotate(${stripeAngle})`);

    // Get the bounding box of the container
    const bbox = stripeContainer.getBoundingClientRect();


    // Create a group to hold the stripes
    const stripes = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    stripes.setAttribute('transform', `rotate(-${stripeAngle})`);
    stripes.setAttribute('clip-path', `url(#${stripeContainer.id}-clip)`);

    // Create a stripe for each color
    const stripeHeight = bbox.height / stripeColors.length;
    for (let i = 0; i < stripeColors.length; i++) {
        // Build the stripe
        const stripe = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        stripe.setAttribute('x', toFixedUnpadded(bbox.x, 3));
        stripe.setAttribute('y', toFixedUnpadded(bbox.y + i * stripeHeight, 3));
        stripe.setAttribute('width', toFixedUnpadded(bbox.width, 3));
        // Note: Small overlap to prevent some aliasing issues
        stripe.setAttribute('height', toFixedUnpadded(stripeHeight + 0.1, 3));
        stripe.setAttribute('fill', stripeColors[i]!);

        // Add the stripe to the group
        stripes.appendChild(stripe);
    }

    // Replace the container with the stripes group
    stripeContainer.replaceWith(stripes);

    // Create a clip path using the original stripe container
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', `${stripeContainer.id}-clip`);
    clipPath.appendChild(stripeContainer);

    // Add the clip path to the document defs
    let defs = document.querySelector('defs');
    if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        document.documentElement.appendChild(defs);
    }
    defs.appendChild(clipPath);
}

export function fillSolidAccents(document: Document, accentSelectorColorMap: Map<string, string>) {
    for (const [selector, color] of accentSelectorColorMap) {
        const element = document.querySelector(selector);
        if (!element) {
            throw new Error(`No element found with selector ${selector}`);
        }
        element.setAttribute('fill', color);
    }
}


// A function that modifies an SVG document
export type SvgDocumentProcessor<T extends unknown[]> = (document: Document, ...args: T) => void;
