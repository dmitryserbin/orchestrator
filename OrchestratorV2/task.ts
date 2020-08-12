import { TaskResult, getBoolInput, setResult } from "azure-pipelines-task-lib/task";

import { IEndpoint } from "./interfaces/task/endpoint";
import { IParameters } from "./interfaces/task/parameters";
import { ITaskHelper } from "./interfaces/helpers/taskhelper";
import { TaskHelper } from "./helpers/taskhelper";
import { IDebugLogger } from "./interfaces/common/debuglogger";
import { DebugLogger } from "./common/debuglogger";
import { ConsoleLogger } from "./common/consolelogger";
import { IConsoleLogger } from "./interfaces/common/consolelogger";
import { IDetails } from "./interfaces/task/details";
import { IOrchestrator } from "./interfaces/orchestrator/orchestrator";
import { Orchestrator } from "./orchestrator/orchestrator";

async function run() {

    const debugLogger: IDebugLogger = new DebugLogger("release-orchestrator");
    const consoleLogger: IConsoleLogger = new ConsoleLogger();

    const taskHelper: ITaskHelper = new TaskHelper(debugLogger);

    try {

        const endpoint: IEndpoint = await taskHelper.getEndpoint();
        const parameters: IParameters = await taskHelper.getParameters();
        const details: IDetails = await taskHelper.getDetails();

        const orchestrator: IOrchestrator = new Orchestrator(endpoint, debugLogger, consoleLogger);

        // Run orchestrator
        await orchestrator.run(parameters, details);

    } catch (err) {

        const result: TaskResult = getBoolInput("IgnoreFailure")
            ? TaskResult.SucceededWithIssues : TaskResult.Failed;

        setResult(result, err.message);

    }

}

run();