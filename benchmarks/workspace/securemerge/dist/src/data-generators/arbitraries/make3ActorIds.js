import { fc } from "../deps.js";
import { makeActorId } from "./makeActorId.js";
export function make3ActorIds() {
    return makeActorId().chain((actorId1) => {
        return fc.tuple(fc.constant(actorId1), makeActorId([actorId1]));
    }).chain(([actorId1, actorId2]) => {
        return fc.tuple(fc.constant(actorId1), fc.constant(actorId2), makeActorId([actorId1, actorId2]));
    });
}
//# sourceMappingURL=make3ActorIds.js.map