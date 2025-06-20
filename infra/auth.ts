export const auth = new sst.aws.Auth("Auth", {
    issuer: "apps/functions/src/auth/index.handler",
});