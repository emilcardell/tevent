import { z } from "zod";
import Redis from "ioredis";

const validationSchema = z.object({ objectionId: z.string(), comment: z.string() });
const anotherValidationSchema = z.object({ id: z.string(), body: z.string() });


const useStreamer = <TValues>(
    schema: z.Schema<TValues>
    ) => {
    return {
        publisher: {
            publish: (values: TValues) => {
                schema.parse(values);
                return values
            }
        },
        subscriber(group: string): {
            on: (callback: (values: TValues) => void) => { 

            }
        }
    }
}

export type useStreamerType = ReturnType<typeof useStreamer>;

export interface ProcedureRouterRecord {
    [key: string]: useStreamerType;
  }

const useMessageQueue = <TValues>(
    schema: z.Schema<TValues>
    ) => {
    console.log(schema);
    return {
        schema,
        publisher: {
            publish: (values: TValues) => {
                schema.parse(values);
                return values
            }
        },
        subscriber: {
            on: (callback: (values: TValues) => void) => { 

            }
            
        }
    }
}



const { publisher, subscriber } = useStreamer(validationSchema);

publisher.publish({ objectionId: "1", comment: "test" });
subscriber('group').on((data)=> console.log(data));

const createStreamContext = <TValues>(streams: TValues) => { 
    return streams;
}


const allTheThings = createStreamContext({
    something: useStreamer(validationSchema),
    somethingElse: useStreamer(anotherValidationSchema)
})


export type EventRouter = typeof allTheThings;


createStreamContext({
    something: useStreamer(validationSchema),
    somethingElse: useStreamer(anotherValidationSchema)
})

const redisStream = <TValues extends ProcedureRouterRecord>(redisConnection: Redis, streams: TValues extends ProcedureRouterRecord) => {

    Object.keys(streams).forEach(key => {
        streams[key].publisher = {
            publish: (values: TValues) => {
                streams[key].parse(values);
                redisConnection.xadd(key, JSON.stringify(values));
            }
        }

        streams[key].subscriber = {
            on: (callback: (values: TValues) => void) => {
                
               return {
                    subscribe() {
                        return redisConnection.xreadgroup('group', 'consumer', key, '0', '>', (err:any, data:any) => {
                            if (err) {
                                console.error(err);
                            }
                            if (data) {
                                callback(data);
                            }
                        }

                    }
                    
               }
                
            }
        }
    });

    return streams;
}
const redis = new Redis();
const streams = redisStream(redis, allTheThings);
streams.something.publisher.publish({ objectionId: "1", comment: "test" });
streams.something.subscriber('group').on((data)=> console.log(data));





