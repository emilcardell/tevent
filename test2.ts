import { z } from "zod";
import Redis from "ioredis";

const validationSchema = z.object({
  objectionId: z.string(),
  comment: z.string(),
});
const anotherValidationSchema = z.object({ id: z.string(), body: z.string() });

const useStream = <TValues>(schema: z.Schema<TValues>) => {
  return {
    streamSchema: schema,
  };
};

const useQueue = <TValues>(schema: z.Schema<TValues>) => {
  return {
    queueSchema: schema,
  };
};

const createPublisher = <TValues>(schema: z.Schema<TValues>) => {
  return {
    schema: schema,
    publish: (values: TValues) => {
      schema.parse(values);
      return values;
    },
  };
};
const createSubscriber = <TValues>(schema: z.Schema<TValues>) => {
  return {
    schema: schema,
    on: (callback: (values: TValues) => void) => {
      return {
        subscribe() {
          return callback;
        },
      };
    },
  };
};

export type publisherType = ReturnType<typeof createPublisher>;
export type subscriberType = ReturnType<typeof createSubscriber>;

export interface PublisherRecord<TValues> {
  [key: string]: ReturnType<typeof createPublisher<TValues>>;
}
export interface SubscriberRecord {
  [key: string]: subscriberType;
}

interface Publisher<TValues> {
  schema: z.Schema<TValues>;
  publish: (values: TValues) => TValues;
}

export type useStreamType = ReturnType<typeof useStream>;
export type useQueueType = ReturnType<typeof useQueue>;
function isStream(
  useType: useStreamType | useQueueType
): useType is useStreamType {
  return useType.hasOwnProperty("streamSchema");
}
function isQueue(
  useType: useStreamType | useQueueType
): useType is useStreamType {
  return useType.hasOwnProperty("queueSchema");
}

export interface ProcedureRouterRecord {
  [key: string]: useStreamType | useQueueType;
}

const createStreamContext = <TValues extends ProcedureRouterRecord>(
  streams: TValues
) => {
  return streams;
};

const allTheThings = createStreamContext({
  something: useStream(validationSchema),
  somethingElse: useQueue(anotherValidationSchema),
});

export type EventRouter = typeof allTheThings;

const redisStream = <TValue extends ProcedureRouterRecord>(
  redisConnection: Redis,
  streams: TValue
) => {
  const internalPublishers = {} as PublisherRecord<any>;
  const externalPublishers = {} as PublisherRecord<any>;
  const internalSubscribers = {} as SubscriberRecord;
  const externalSubScribers = {} as SubscriberRecord;
  
  Object.entries(streams)
      .forEach(([key, value]) => console.log(`${key}: ${value}`))


  Object.keys(streams).forEach((key) => {
    const prop = streams[key];
    if (isStream(prop)) {
      type schemaType = z.infer<typeof prop.streamSchema>;
      internalPublishers[key] = createPublisher<schemaType>(prop.streamSchema);
      externalSubScribers[key] = createSubscriber(prop.streamSchema);
    }

    if (isQueue(prop)) {
      type schemaType = z.infer<typeof prop.streamSchema>;
      internalSubscribers[key] = createSubscriber<schemaType>(
        prop.streamSchema
      );
      externalPublishers[key] = createPublisher<schemaType>(prop.streamSchema);
    }
  });

  return {
    internalPublishers,
    externalPublishers,
    internalSubscribers,
    externalSubScribers,
  };
};
const redis = new Redis();
const { externalPublishers, externalSubScribers } = redisStream<EventRouter>(
  redis,
  allTheThings
);
externalPublishers.something.publish({ id: "1", comment: "test" });
externalSubScribers.something.on((data) => console.log(data.id));

/*
  
 Object.keys(streams).forEach(key => {
        if(streams[key].streamSchema) {
            internal[key] = streams[key].streamSchema;
        }


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


     */
