import { BaseContext, GraphQLRequestListener } from "@apollo/server";
import { Audience, StreamdalConfigs, StreamdalRegistration } from "@streamdal/node-sdk";
export type Streamdal = {
    configs: StreamdalConfigs & {
        abortOnError?: boolean;
        disableAutomaticPipelines?: boolean;
    };
    registration: StreamdalRegistration;
};
export interface StreamdalContext extends BaseContext {
    streamdalAudience?: Audience;
}
export declare const streamdalPlugin: (streamdalConfigs?: StreamdalConfigs) => Promise<{
    serverWillStart(): Promise<void>;
    requestDidStart(): Promise<GraphQLRequestListener<any>>;
}>;
