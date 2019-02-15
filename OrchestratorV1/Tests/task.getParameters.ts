import * as path from "path";

import * as mr from "azure-pipelines-task-lib/mock-run";

import { MockInput } from "./helpers";

const tmr: mr.TaskMockRunner = new mr.TaskMockRunner(path.join(__dirname, "mock.getParameters.js"));

MockInput(tmr, [

    "ReleaseStrategy",
    "StageStrategy",
    "ArtifactStrategy",
    "IgnoreFailure",
    "TargetProject",
    "TargetDefinition",
    "TargetDefinitionStages",
    "TargetRelease",
    "TargetReleaseStages",
    "TargetArtifactVersion",

]);

tmr.run();
