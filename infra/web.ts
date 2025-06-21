import { auth, profile } from './auth';

export const web = new sst.aws.StaticSite("Web", {
    path: "apps/web",
    build: {
      output: "dist",
      command: "pnpm build",
    },
    environment: {
      VITE_API_URL: profile.url,
      VITE_AUTH_URL: auth.url,
    },
  });