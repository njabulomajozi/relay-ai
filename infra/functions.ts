new sst.aws.Function("Hono", {
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
        }
    ],
});