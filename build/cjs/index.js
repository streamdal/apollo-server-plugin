"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamdalPlugin = void 0;
const node_sdk_1 = require("@streamdal/node-sdk");
const register = async (streamdalConfigs) => {
    if (streamdalConfigs) {
        return {
            configs: streamdalConfigs,
            registration: await (0, node_sdk_1.registerStreamdal)(streamdalConfigs),
        };
    }
    if (process.env.STREAMDAL_URL &&
        process.env.STREAMDAL_TOKEN &&
        process.env.STREAMDAL_SERVICE_NAME) {
        return {
            registration: await (0, node_sdk_1.registerStreamdal)({
                streamdalUrl: process.env.STREAMDAL_URL,
                streamdalToken: process.env.STREAMDAL_TOKEN,
                serviceName: process.env.STREAMDAL_SERVICE_NAME,
            }),
            configs: {
                streamdalUrl: process.env.STREAMDAL_URL,
                streamdalToken: process.env.STREAMDAL_TOKEN,
                serviceName: process.env.STREAMDAL_SERVICE_NAME,
                abortOnError: !!process.env.STREAMDAL_ABORT_ON_ERROR,
                disableAutomaticPipelines: !!process.env.STREAMDAL_DISABLE_AUTOMATIC_PIPELINES,
            },
        };
    }
    return null;
};
const streamdalPlugin = async (streamdalConfigs) => {
    const streamdal = await register(streamdalConfigs);
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    return {
        async serverWillStart() {
            console.debug("streamdal apollo server plugin is runnning...");
        },
        async requestDidStart() {
            return {
                async didResolveOperation({ request, operationName, contextValue, }) {
                    if (operationName !== "IntrospectionQuery" &&
                        streamdal &&
                        //
                        // Suppress ts errors as body is typed as unknown
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-expect-error
                        request.http?.body?.variables) {
                        const audience = contextValue.streamdalAudience ?? {
                            //
                            // Ok to assert name here as registration will fail if it's not provided
                            serviceName: streamdal.configs.serviceName,
                            componentName: "apollo-server",
                            operationType: node_sdk_1.OperationType.PRODUCER,
                            operationName: operationName || "unknown-operation",
                        };
                        const streamdalResult = await streamdal.registration.process({
                            audience,
                            data: encoder.encode(JSON.stringify(request.variables)),
                        });
                        const data = decoder.decode(streamdalResult.data);
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-expect-error
                        request.http.body.variables = JSON.parse(data);
                    }
                },
                async willSendResponse({ operationName, response, contextValue, }) {
                    if (operationName !== "IntrospectionQuery" &&
                        streamdal &&
                        response.body &&
                        response.body.kind === "single" &&
                        response.body.singleResult.data) {
                        const audience = contextValue.streamdalAudience ?? {
                            serviceName: streamdal.configs.serviceName,
                            componentName: "apollo-server",
                            operationType: node_sdk_1.OperationType.CONSUMER,
                            operationName: operationName ?? "unknown-operation",
                        };
                        const streamdalResult = await streamdal.registration.process({
                            audience,
                            data: encoder.encode(JSON.stringify(response.body.singleResult.data)),
                        });
                        const data = decoder.decode(streamdalResult.data);
                        response.body.singleResult.data = JSON.parse(data);
                    }
                },
            };
        },
    };
};
exports.streamdalPlugin = streamdalPlugin;
//# sourceMappingURL=index.js.map