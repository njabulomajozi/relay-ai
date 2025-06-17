import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import {
    BedrockClient,
    GetFoundationModelCommand,
    ListFoundationModelsCommand,
} from "@aws-sdk/client-bedrock";
import {
    BedrockRuntimeClient,
    InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
    Utils
} from "@relay-ai/shared";

const telementry = Utils.Telementry.Hono.HonoTelementry.getInstance('RelayAI_Models', '1.0');

const ENABLED_MODELS = new Set(['anthropic.claude-3-5-sonnet-20240620-v1:0']);

const app = new Hono();
app.use('*', telementry.otel());

app.get('/', async (c) => {
    const client = new BedrockClient();

    const {
        provider: PROVIDER,
        inferenceType: INFERENCE_TYPE,
    } = c.req.query()

    const input = {
        byProvider: PROVIDER || undefined,
        // byCustomizationType: 'FINE_TUNING' || 'CONTINUED_PRE_TRAINING',
        // byOutputModality: 'TEXT' || 'IMAGE' || 'EMBEDDING',
        byInferenceType: INFERENCE_TYPE || undefined,
    };

    const command = new ListFoundationModelsCommand(input);

    const response = await client.send(command);

    const models = response.modelSummaries
        ?.filter(({ modelId }) => ENABLED_MODELS.has(modelId || ''))
        ?.map(({
            guardrailsSupported,
            inferenceTypesSupported,
            inputModalities,
            outputModalities,
            intelligentPromptRouting,
            modelArn,
            modelName,
            modelId,
            providerName,
            responseStreamingSupported
        }) => {
            return {
                guardrailsSupported,
                inferenceTypesSupported,
                inputModalities,
                outputModalities,
                intelligentPromptRouting,
                modelArn,
                modelName,
                modelId,
                providerName,
                responseStreamingSupported
            }
        });

    return c.json({
        data: models
    });
});

app.post('/invoke', async (c) => {
    try {
        const client = new BedrockRuntimeClient();
        const {
            prompt: PROMPT,
            modelId
        } = await c.req.json();
        const payload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 1000,
            messages: [
                {
                    role: "user",
                    content: [{ type: "text", text: PROMPT }],
                },
            ],
        };
        const input = {
            contentType: "application/json",
            body: JSON.stringify(payload),
            modelId
        };
        const command = new InvokeModelCommand(input);
        const apiResponse = await client.send(command);
        const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
        const responseBody = JSON.parse(decodedResponseBody);
        const responses = responseBody.content;
        return c.json({
            data: responses
        });
    } catch (error) {
        console.log('Error in /invoke:', error);
        return c.json({ error: error.message }, 500);
    }
});

app.get('/:modelId', async (c) => {
    const modelId = c.req.param('modelId');

    if (!ENABLED_MODELS.has(modelId || '')) {
        return c.notFound();
    }

    const client = new BedrockClient();

    const command = new GetFoundationModelCommand({
        modelIdentifier: modelId,
    });

    const response = await client.send(command);

    const details = response.modelDetails;

    return c.json(details);
});

export const handler = handle(app);