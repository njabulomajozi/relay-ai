import { auth } from './auth';

export const models = new sst.aws.Function("Models", {
    link: [auth],
    url: true,
    handler: "apps/functions/src/models/index.handler",
    permissions: [
        {
            actions: ['bedrock:ListFoundationModels'],
            resources: ['*'],
        },
        {
            actions: ['bedrock:GetFoundationModel'],
            resources: ['*']
        },
        {
            actions: ['bedrock:InvokeModel'],
            resources: ['*']
        }
    ],
});