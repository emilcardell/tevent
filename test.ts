import { z } from "zod";
import { Parser, getParseFn } from "./parser";

function input<$Parser extends Parser>(input: $Parser) {
    const parser = getParseFn(input as Parser);
}



input(z.object({ objectionId: z.string(), comment: z.string() }));

const what = z.object({ objectionId: z.string(), comment: z.string() });