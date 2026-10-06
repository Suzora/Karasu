import { setEntityTable } from "@/lib/htmlEntities";
import { HTML5_ENTITIES } from "@/lib/htmlEntities.data";

// The node project has no DOM to ask, so its parsers answer from the generated table the browser's decoding is held to.
setEntityTable(HTML5_ENTITIES);
