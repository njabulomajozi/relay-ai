import { Resource } from "sst";
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
    Utils,
    Middlewares
} from "@relay-ai/shared";
import { subjects } from "../auth/subjects";

const telementry = Utils.Telementry.Hono.HonoTelementry.getInstance('RelayAI', '1.0');

const ENABLED_MODELS = new Set(['anthropic.claude-3-5-sonnet-20240620-v1:0']);

const app = new Hono();

app.use('*', Middlewares.Hono.Auth.middleware({
    clientID: "jwt-api",
    issuer: Resource.Auth.url,
    subjects
}));

app.use('*', telementry.otel());

app.get('/', async (c) => {
    const client = new BedrockClient();

    const {
        provider: PROVIDER,
        inferenceType: INFERENCE_TYPE,
    } = c.req.query();

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
    const tracer = telementry.getTracer('models.invoke', '1.0');
    try {
        const input = await (async (c, tracer) => {
            return tracer.startActiveSpan('processInput', async (span) => {
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

                span.setAttribute('payload.prompt', PROMPT.length);
                span.setAttribute('payload.modelId', modelId);
                span.setAttribute('input.anthropic_version', 'bedrock-2023-05-31');
                span.setAttribute('input.max_tokens', 1000);

                span.end();
                return input;
            });
        })(c, tracer);

        const apiResponse = await (async (tracer) => {
            return tracer.startActiveSpan('promptModel', async (span) => {
                const client = new BedrockRuntimeClient();
                const command = new InvokeModelCommand(input);
                const apiResponse = await client.send(command);

                span.setAttribute('bedrock.attempts', apiResponse.$metadata.attempts || 1);

                span.end();
                return apiResponse;
            });
        })(tracer);


        const responses = await (async (tracer, apiResponse) => {
            return tracer.startActiveSpan('prepareResults', async (span) => {
                const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
                const responseBody = JSON.parse(decodedResponseBody);
                const responses = responseBody.content;

                // span.setAttribute('response.types', responses?.type || '');
                // span.setAttribute('response.data', responses?.text || '');

                span.end();
                return responses;
            });
        })(tracer, apiResponse);

        return c.json({
            data: responses
        });
    } catch (error) {
        const message = await (async (tracer, error) => {
            return tracer.startActiveSpan('prepareResults', async (span) => {

                const message = error.message;

                span.setAttribute('error.message', message);

                span.end();
                return message;
            });
        })(tracer, error);

        return c.json({ error: message }, 500);
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