import { readFile, rm, mkdir, writeFile } from 'fs/promises';

// @ts-ignore, https://github.com/svgdotjs/svgdom/issues/69
import { createSVGDocument, HTMLParser } from 'svgdom';
import { SVGPathData } from 'svg-pathdata';
import { render as renderSVG } from '@resvg/resvg-js';

interface BuildConfig {
    combinations: CombinationConfig[];
    templates: Record<string, TemplateConfig>;
    prides: Record<string, PrideConfig>;
}

interface CombinationConfig {
    templates: "*" | string[];
    prides: "*" | string[];
}

interface TemplateConfig {
    name: string;
    templateFile: string;
    stripesId: string;
    stripesRotation?: number;
    accentIds?: string[];
}

interface PrideConfig {
    name: string;
    stripes: string[];
    accents?: Record<string, string>;
    variants?: Record<string, PrideVariant>;
}

interface PrideVariant {
    name: string;
    stripes?: string[];
    accents?: Record<string, string>;
}

interface ReadmeData {
    id: string;
    name: string;
    svg: string;
    png: string;
}

const DEBUG = false;

const readmeData: ReadmeData[] = [];

async function exportSvg(name: string, id: string, dom: Element) {
    // Export the SVG data
    const svgData = dom.outerHTML;

    // Remove &quot; since this breaks resvg
    const svgDataFixed = svgData.replace(/&quot;/g, '');

const frontMater = id.endsWith("heart") || id.endsWith("heart-d") || id.endsWith("flag") || id.endsWith("syringe") || id.endsWith("egg") ? `---
title: ${name}
sources:
 - name: CyberPon3
   link: https://twitter.com/CyberPon3
 - name: Twemoji
   link: https://twemoji.twitter.com/
license: CC-BY-NC-4.0
---
` : id.endsWith("cat") ? `---
title: ${name}
sources:
 - name: CyberPon3
   link: https://twitter.com/CyberPon3
 - name: Noto Emoji
   link: https://github.com/googlefonts/noto-emoji/blob/f2a4f72b/svg/emoji_u1f408.svg
license: Apache License 2.0
---
` : id.endsWith("ghost") ? `---
title: ${name}
sources:
 - name: CyberPon3
   link: https://twitter.com/CyberPon3
 - name: Noto Emoji
   link: https://github.com/googlefonts/noto-emoji/blob/617db977/svg/emoji_u1f47b.svg
license: Apache License 2.0
---
` : ""

    // Write the SVG
    const svgLocation = `./dist/svg/${id}.svg`;
    await writeFile(svgLocation, frontMater + svgDataFixed);

    // Render to a png
    const pngData = renderSVG(svgDataFixed, { fitTo: { mode: 'width', value: 360 } });

    // Write the png
    const pngLocation = `./dist/png/${id}.png`;
    await writeFile(pngLocation, pngData);

    readmeData.push({
        id, name,
        svg: svgLocation,
        png: pngLocation
    });
}

function roundToDecimal(num: number, decimals: number): string {
    return num.toFixed(decimals).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1')
}

function getRotatedBounds(pathElement: Element, rotation: number) {
    const path = pathElement.getAttribute("d") || "";
    const bounds = new SVGPathData(path)
        .rotate(rotation * (Math.PI / 180))
        .getBounds();
    return {
        h: bounds.maxY - bounds.minY,
        w: bounds.maxX - bounds.minX,
        x: bounds.minX,
        y: bounds.minY,
    }
}

function getPathBounds(pathElement: Element) {
    const path = pathElement.getAttribute("d") || "";
    const bounds = new SVGPathData(path).getBounds();
    return {
        h: bounds.maxY - bounds.minY,
        w: bounds.maxX - bounds.minX,
        x: bounds.minX,
        y: bounds.minY,
    }
}

function addElement(parent: Element, element: Element | string, attributes?: Record<string, string | number>) {
    const el = typeof element === 'string' ? parent.ownerDocument.createElement(element) : element;
    if (attributes) {
        Object.keys(attributes).forEach(v => el.setAttribute(v, attributes[v]!.toString()));
    }
    parent.appendChild(el);
    return el;
}

function fillStripes(templateDom: Element, id: string, stripes: string[], rotation: number) {
    // Get the stripe container
    const stripeContainer = templateDom.querySelector("#" + id);
    if (!stripeContainer) {
        throw new Error(`Invalid stripeContainer '#${id}'.`);
    }

    if (DEBUG) {
        const bb = getPathBounds(stripeContainer);

        addElement(templateDom, "rect", {
            x: roundToDecimal(bb.x, 3),
            y: roundToDecimal(bb.y, 3),
            width: roundToDecimal(bb.w, 3),
            height: roundToDecimal(bb.h, 3),
            fill: "none",
            stroke: "green",
            "stroke-width": 0.5
        });

        addElement(templateDom, stripeContainer.cloneNode() as Element, {
            fill: "none",
            stroke: "green",
            "stroke-width": "0.5",
        });
    }

    // Rotate the stripe container
    stripeContainer.setAttribute("transform", `rotate(${rotation})`);

    // Get the bounding box
    const bb = getRotatedBounds(stripeContainer, rotation);

    if (DEBUG) {
        addElement(templateDom, "rect", {
            x: roundToDecimal(bb.x, 3),
            y: roundToDecimal(bb.y, 3),
            width: roundToDecimal(bb.w, 3),
            height: roundToDecimal(bb.h, 3),
            fill: "none",
            stroke: "red",
            "stroke-width": 0.5
        });

        const bb2 = getPathBounds(stripeContainer);

        addElement(templateDom, "rect", {
            x: roundToDecimal(bb2.x, 3),
            y: roundToDecimal(bb2.y, 3),
            width: roundToDecimal(bb2.w, 3),
            height: roundToDecimal(bb2.h, 3),
            fill: "none", stroke: "#00ffff", "stroke-width": 0.5
        });

        addElement(templateDom, stripeContainer.cloneNode() as Element, {
            fill: "none",
            stroke: "#ff00ff",
            "stroke-width": "0.5",
        });
    }

    // Create a group for all the stripes
    const stripesGroup = addElement(templateDom, 'g', {
        "transform": `rotate(${-rotation})`, // Rotate the stripes
        "clip-path": "url(#stripesClip)" // Clip the stripes
    });

    // Make sure it's in the right layer
    templateDom.insertBefore(stripesGroup, stripeContainer);

    // Fill the bounding box with stripes
    const stripeCount = stripes.length;
    const stripeHeight = bb.h / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
        const color = stripes[i]!;

        addElement(stripesGroup, "rect", {
            x: roundToDecimal(bb.x, 3),
            y: roundToDecimal(bb.y + (stripeHeight * i), 3),
            width: roundToDecimal(bb.w, 3),
            height: roundToDecimal(stripeHeight + 0.1, 3), // Small overlap to prevent some aliasing issues
            fill: color,
        });
    }

    if (DEBUG) {
        addElement(templateDom, "rect", {
            x: roundToDecimal(bb.x, 3),
            y: roundToDecimal(bb.y, 3),
            width: roundToDecimal(bb.w, 3),
            height: roundToDecimal(bb.h, 3),
            fill: "none",
            stroke: "blue",
            "stroke-width": 0.5,
            transform: `rotate(${-rotation})`
        });
    }

    // Create a clip path for the stripe container
    const defs = addElement(templateDom, "defs");
    const clipPath = addElement(defs, "clipPath", { id: "stripesClip" });
    clipPath.appendChild(stripeContainer);
}

function fillAccents(element: Element, accentIds: string[], accentColors: Map<string, string>, fallbackColor: string) {
    accentIds.forEach((value) => {
        const accent = element.querySelector("#" + value);
        if (accent) {
            accent.setAttribute("fill", accentColors.get(value) || fallbackColor);
        }
    });
}

function parseSVG(svg: string): Element {
    const document = createSVGDocument() as HTMLDocument;
    HTMLParser(svg, document);
    return document.documentElement;
}

async function run() {
    // Read the build config
    const buildConfig: BuildConfig = JSON.parse(await readFile("./build-config.json", { encoding: "utf-8" }));

    // Clean the dist directory
    await rm("./dist", { force: true, recursive: true });
    await mkdir("./dist/svg", { recursive: true });
    await mkdir("./dist/png", { recursive: true });

    // Generate emotes
    const { combinations, templates, prides } = buildConfig;
    const availableTemplates = new Map(Object.entries(templates));
    const availablePrides = new Map(Object.entries(prides));

    for (let i = 0; i < combinations.length; i++) {
        console.log(`Processing combination ${i + 1} of ${combinations.length}...`);
        const combination = combinations[i]!;

        // Collect the templates
        let comboTemplates: Map<string, TemplateConfig>;
        if (combination.templates === "*") {
            comboTemplates = availableTemplates;
        } else {
            comboTemplates = new Map<string, TemplateConfig>();
            for (const key of combination.templates) {
                const template = availableTemplates.get(key);
                if (template) {
                    comboTemplates.set(key, template);
                } else {
                    console.warn(`A template with id '${key}' could not be found.`)
                }
            }
        }

        // Collect the prides
        let comboPrides: Map<string, PrideConfig>;
        if (combination.prides === "*") {
            comboPrides = availablePrides;
        } else {
            comboPrides = new Map<string, PrideConfig>();
            for (const key of combination.prides) {
                const pride = availablePrides.get(key);
                if (pride) {
                    comboPrides.set(key, pride);
                } else {
                    console.warn(`A pride with id '${key}' could not be found.`)
                }
            }
        }

        // Combine
        for (const [templateId, template] of comboTemplates) {

            const templateFileContent = await readFile(template.templateFile, { encoding: "utf-8" });
            const templateAccentIds = template.accentIds || [];

            for (const [prideId, pride] of comboPrides) {
                console.log(`Generating ${prideId}-${templateId}`);


                // Parse the template
                const root = parseSVG(templateFileContent);

                // Fill the stripes
                fillStripes(root, template.stripesId, pride.stripes, template.stripesRotation || 0);

                // Fill accents
                if (template.accentIds) {
                    const prideAccents = new Map(Object.entries(pride.accents || {}).filter(([k]) => templateAccentIds.includes(k)))
                    fillAccents(root, template.accentIds, prideAccents, pride.stripes[0] || "red");
                }

                // Export
                await exportSvg(`${pride.name} ${template.name}`, `${prideId}-${templateId}`, root);

                // Handle variants
                if (pride.variants) {
                    for (const [variantId, variant] of Object.entries(pride.variants)) {
                        // Only render the variant if it has new stripes or new accents
                        if (variant.stripes || (variant.accents && Object.keys(variant.accents).some(k => templateAccentIds.includes(k)))) {

                            // Parse the template
                            const variantRoot = parseSVG(templateFileContent);

                            // Fill the stripes
                            fillStripes(variantRoot, template.stripesId, variant.stripes || pride.stripes, template.stripesRotation || 0);

                            // Fill accents
                            if (template.accentIds) {
                                const variantAccents = new Map(Object.entries(variant.accents || pride.accents || {}).filter(([k]) => templateAccentIds.includes(k)))
                                fillAccents(variantRoot, template.accentIds, variantAccents, variant.stripes?.[0] || pride.stripes[0] || "red");
                            }

                            // Export
                            await exportSvg(`${pride.name} ${template.name} (${variant.name})`, `${prideId}-${variantId}-${templateId}`, variantRoot);
                        }
                    }
                }
            }
        }
    }

    // Fill in README
    const fileHost = "https://pridemoji.cp3.es/";
    const tableWidth = 5;
    const cells = readmeData.map(({ name, svg, png }) => `<img src="${joinUrl(fileHost, png)}" height="64" title="${name}"/><br/> [svg](${joinUrl(fileHost, svg)}) - [png](${joinUrl(fileHost, png)})`);
    const table = "|" + Array(tableWidth).fill(" ").join("|") + "|\n"
        + "|" + Array(tableWidth).fill("-").join("|") + "|\n"
        + chunk(cells, tableWidth).map(c => "|" + c.join("|") + "|\n").join("");

    const readmeContent = await readFile("./README.md");
    const startIndex = readmeContent.indexOf("<!-- EMOJIGRID -->");
    const endIndex = readmeContent.indexOf("<!-- ENDEMOJIGRID -->");
    const newContent = readmeContent.slice(0, startIndex)
        + "<!-- EMOJIGRID -->\n"
        + table
        + readmeContent.slice(endIndex);

    await writeFile("./README.md", newContent);
}

function joinUrl(a: string, b: string) {
    return b.replace("./dist", a);
    //return new URL(b, a).href;
}

function chunk<T>(arr: T[], size: number) {
    const rtn = [];
    let i, j;
    for (i = 0, j = arr.length; i < j; i += size) {
        rtn.push(arr.slice(i, i + size));
    }
    return rtn;
}

run().catch(console.error);
