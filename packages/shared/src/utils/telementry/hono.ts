import { NodeSDK } from '@opentelemetry/sdk-node';
import {
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { otel as honoOtel } from '@hono/otel';

export class HonoTelementry {
    private static instance: HonoTelementry;
    private sdk: NodeSDK;

    private constructor(serviceName: string, version: string) {
        this.sdk = new NodeSDK({
            resource: resourceFromAttributes({
                [ATTR_SERVICE_NAME]: serviceName,
                [ATTR_SERVICE_VERSION]: version,
            }),
            traceExporter: new ConsoleSpanExporter(),
        });

        this.sdk.start();
    }

    public static getInstance(serviceName: string, version: string): HonoTelementry {
        if (!HonoTelementry.instance) {
            HonoTelementry.instance = new HonoTelementry(serviceName, version);
        }
        return HonoTelementry.instance;
    }

    public otel() {
        return honoOtel();
    }
}