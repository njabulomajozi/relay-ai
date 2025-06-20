import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HonoTelementry } from '../../../src/utils/telementry/hono';

// Mock the OpenTelemetry dependencies
vi.mock('@opentelemetry/sdk-node', () => ({
    NodeSDK: vi.fn().mockImplementation(() => ({
        start: vi.fn(),
    })),
}));

vi.mock('@opentelemetry/sdk-trace-node', () => ({
    ConsoleSpanExporter: vi.fn(),
}));

vi.mock('@hono/otel', () => ({
    otel: vi.fn(() => 'mocked-otel-middleware'),
}));

vi.mock('@opentelemetry/resources', () => ({
    resourceFromAttributes: vi.fn(() => 'mocked-resource'),
}));

describe('HonoTelementry', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        vi.clearAllMocks();
        // Reset the singleton instance
        (HonoTelementry as any).instance = undefined;
    });

    describe('getInstance', () => {
        it('should create a new instance when none exists', () => {
            const instance = HonoTelementry.getInstance('test-service', '1.0.0');
            
            expect(instance).toBeInstanceOf(HonoTelementry);
        });

        it('should return the same instance on subsequent calls (singleton pattern)', () => {
            const instance1 = HonoTelementry.getInstance('test-service', '1.0.0');
            const instance2 = HonoTelementry.getInstance('test-service', '1.0.0');
            
            expect(instance1).toBe(instance2);
        });

        it('should ignore different parameters on subsequent calls', () => {
            const instance1 = HonoTelementry.getInstance('test-service', '1.0.0');
            const instance2 = HonoTelementry.getInstance('different-service', '2.0.0');
            
            expect(instance1).toBe(instance2);
        });
    });

    describe('otel', () => {
        it('should return the otel middleware', () => {
            const instance = HonoTelementry.getInstance('test-service', '1.0.0');
            const otelMiddleware = instance.otel();
            
            expect(otelMiddleware).toBe('mocked-otel-middleware');
        });
    });

    describe('initialization', () => {
        it('should initialize without throwing errors', () => {
            expect(() => {
                HonoTelementry.getInstance('test-service', '1.0.0');
            }).not.toThrow();
        });
    });
}); 