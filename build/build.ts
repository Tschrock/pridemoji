import { rm, mkdir } from 'node:fs/promises'

export async function clean() {
    await rm("./dist", { force: true, recursive: true });
    await mkdir("./dist/svg", { recursive: true });
    await mkdir("./dist/png", { recursive: true });
}

export async function build() {
    await clean();

}
