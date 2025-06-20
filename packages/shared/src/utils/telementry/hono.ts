import { NodeSDK } from '@opentelemetry/sdk-node';
import {
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { type MiddlewareHandler } from 'hono';
import { otel as honoOtel } from '@hono/otel';
import { trace } from '@opentelemetry/api';

export class HonoTelementry {
    private static instance: HonoTelementry;
    private sdk: NodeSDK;

    private constructor(applicationName: string, version: string) {
        this.sdk = new NodeSDK({
            resource: resourceFromAttributes({
                [ATTR_SERVICE_NAME]: applicationName,
                [ATTR_SERVICE_VERSION]: version,
            }),
            traceExporter: new ConsoleSpanExporter(),
        });

        this.sdk.start();
    }

    public static getInstance(applicationName: string, version: string): HonoTelementry {
        if (!HonoTelementry.instance) {
            HonoTelementry.instance = new HonoTelementry(applicationName, version);
        }
        return HonoTelementry.instance;
    }

    public otel(): MiddlewareHandler {
        return honoOtel();
    }

    public getTracer(flowName: string, version: string) {
        return trace.getTracer(flowName, version);
    }
}