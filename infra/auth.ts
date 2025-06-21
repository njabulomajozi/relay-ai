export const auth = new sst.aws.Auth("Auth", {
    issuer: "apps/functions/src/auth/index.handler",
});

export const profile = new sst.aws.Function("Profile", {
  url: true,
  link: [auth],
  handler: "apps/functions/src/auth/profile.handler",
});