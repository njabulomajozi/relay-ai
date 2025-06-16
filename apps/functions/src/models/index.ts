import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import {
    BedrockClient,
    GetFoundationModelCommand,
    ListFoundationModelsCommand,
} from "@aws-sdk/client-bedrock";

const app = new Hono();

app.get('/', async (c) => {
    const client = new BedrockClient();

    const input = {
        // byProvider: 'STRING_VALUE',
        // byCustomizationType: 'FINE_TUNING' || 'CONTINUED_PRE_TRAINING',
        // byOutputModality: 'TEXT' || 'IMAGE' || 'EMBEDDING',
        // byInferenceType: 'ON_DEMAND' || 'PROVISIONED',
    };

    const command = new ListFoundationModelsCommand(input);

    const response = await client.send(command);

    const models = response.modelSummaries?.map(({
        modelName,
        modelId,
        modelArn,
        providerName,
        inputModalities,
        outputModalities
    }) => {
        return {
            modelName,
            modelId,
            providerName
        }
    });

    return c.json({
        data: {
            models
        }
    });
})
.post('/', async (c) => {
    return c.json({
        // data: details
    });
});

app.get('/:modelId', async (c) => {
    const modelId = c.req.param('modelId');

    const client = new BedrockClient();

    const command = new GetFoundationModelCommand({
        modelIdentifier: modelId,
    });

    const response = await client.send(command);

    const details = response.modelDetails;

    return c.json({
        data: details
    });
});

export const handler = handle(app);