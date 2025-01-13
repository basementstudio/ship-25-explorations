# ogl-starter

The objective of this boilerplate is to set up everything the developer will need (in terms of configuration) to start an OGL project with TypeScript. ESLint and Prettier are configured to work independently of the user's IDE configuration (as long as it's VSCode).

![OGL + TypeScript](https://github.com/user-attachments/assets/75c3433f-c927-4a42-8a1d-16379c161724)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbasementstudio%ogl-starter&env=NEXT_PUBLIC_SITE_URL&envDescription=e.g%3A%20https%3A%2F%2Fproject-name.vercel.app)

## Featured Aspects of the Stack

- [react-ogl](https://github.com/pmndrs/react-ogl)
- [TypeScript](https://www.typescriptlang.org/)
- [Next.js](https://nextjs.org/)
- [TailwindCSS](https://tailwindcss.com/)

## Things to Note

- Components, utilities, etc. are located under `/src`. If you are changing this, be sure to also update `tsconfig.json`'s `baseUrl`.

## Development

1. Install pnpm:

   ```
   npm install -g pnpm
   ```

2. Install the dependencies with:

   ```
   pnpm
   ```

3. Start developing and watch for code changes:

   ```
   pnpm dev
   ```

## Important Things to Do

- [ ] Check out `.env.example` for required environment variables to run the project.
- [ ] Add favicons. (Re)Place in `./public`: _32x32_ `favicon.ico`, _perfect square_ `favicon.svg` and `favicon-dark.svg` (_dark theme_), _512x512_ `icon-512.png`, _192x192_ `icon-192.png`, _180x180_ `apple-touch-icon.png`.
- [ ] Delete `console.log(basementLog)` if not wanted — it's under `main.ts`.
- [ ] Replace the contents of this file (`README.md`) with the contents of the `README.example.md` file — make sure to adapt it to your project's specific needs. Finally, delete the old `README.example.md` file.

## Implementation details

### Global canvas

To improve performance, there is a global canvas that is created once and reused throughout the app. This canvas can be found inside of `src/app/(with-canvas)/layout.tsx`. So, if you want to add 3D elements to your page, you should create that page inside the `(with-canvas)` folder.

This is done so that you can split what pages that need 3D elements from those that don't.
If you want the canvas to be present in all pages, you can move it inside of `src/app/layout.tsx` file.

### WebGL context

Inside of `src/app/gl/index.ts` there is a `GLOBAL_GL` variable that is the instance of the WebGL context. This is used to render all of the GL components.

You can use it to create programs outside of the React context.

```ts
import { GLOBAL_GL } from "~/gl"

export const myCamera = new Camera(GLOBAL_GL, {
  fov: 75
})
```

### Debug mode
If you visit the site with the `?debug` param, the debug mode will be active, this will add some utils to the site:

- Leva panel: Inside the leva pannel, you will see shortcuts to toggle helpers, grid, device data and more.
- Use `command+i` to toggle element outlines.

| To achieve this, we implemented a custom canvas inside of `src/app/gl/basement-canvas.tsx`, it is based on the original canvas from `react-ogl`.

---

If you find you need to make extra config to make this work more seamlessly, feel free to submit a PR suggesting your changes. Our focus is to get you up and running with the least steps and burden as possible.

---

![cover image](https://github.com/basementstudio/next-typescript/raw/main/src/app/opengraph-image.png 'We Make Cool Sh*t That Performs')
