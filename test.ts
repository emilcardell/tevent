import { z } from "zod";
import { Parser, getParseFn } from "./parser";

function input<$Parser extends Parser>(input: $Parser) {
    const parser = getParseFn(input as Parser);
}



input(z.object({ objectionId: z.string(), comment: z.string() }));

const what = z.object({ objectionId: z.string(), comment: z.string() });

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


//const { publisher, subscriber } = useStreamer(validationSchema);
/*
publisher.publish({ objectionId: "1", comment: "test" });
subscriber('group').on((data)=> console.log(data));
*/