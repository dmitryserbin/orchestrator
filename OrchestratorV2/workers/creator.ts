import Debug from "debug";

import { TeamProject } from "azure-devops-node-api/interfaces/CoreInterfaces";
import { ReleaseDefinition, Release } from "azure-devops-node-api/interfaces/ReleaseInterfaces";

import { IParameters, ReleaseType } from "../interfaces/task/parameters";
import { IDetails } from "../interfaces/task/details";
import { IDebugLogger } from "../interfaces/common/debuglogger";
import { IConsoleLogger } from "../interfaces/common/consolelogger";
import { ICoreHelper } from "../interfaces/helpers/corehelper";
import { IReleaseHelper } from "../interfaces/helpers/releasehelper";
import { ICreator } from "../interfaces/workers/creator";
import { IBuildHelper } from "../interfaces/helpers/buildhelper";
import { IReleaseJob } from "../interfaces/orchestrator/releasejob";
import { IReleaseFilter } from "../interfaces/orchestrator/releasefilter";

export class Creator implements ICreator {

    private debugLogger: Debug.Debugger;
    private consoleLogger: IConsoleLogger;

    private coreHelper: ICoreHelper;
    private buildHelper: IBuildHelper;
    private releaseHelper: IReleaseHelper;

    constructor(coreHelper: ICoreHelper, buildHelper: IBuildHelper, releaseHelper: IReleaseHelper, debugLogger: IDebugLogger, consoleLogger: IConsoleLogger) {

        this.debugLogger = debugLogger.create(this.constructor.name);
        this.consoleLogger = consoleLogger;

        this.coreHelper = coreHelper;
        this.buildHelper = buildHelper;
        this.releaseHelper = releaseHelper;

    }

    public async createJob(parameters: IParameters, details: IDetails): Promise<IReleaseJob> {

        const debug = this.debugLogger.extend(this.createJob.name);

        const targetProject: TeamProject = await this.coreHelper.getProject(parameters.projectId);
        const targetDefinition: ReleaseDefinition = await this.releaseHelper.getDefinition(targetProject.name!, Number(parameters.definitionId));

        this.consoleLogger.log(`Starting <${targetProject.name}> project ${ReleaseType[parameters.releaseType].toLowerCase()} <${targetDefinition.name}> release pipeline deployment`);

        const targetRelease: Release = await this.createRelease(targetProject, targetDefinition, parameters, details);
        const targetStages: string[] = await this.releaseHelper.getStages(targetRelease, parameters.stages);

        const releaseJob: IReleaseJob = {

            project: targetProject,
            definition: targetDefinition,
            release: targetRelease,
            stages: targetStages,
            sleep: 5000,

        };

        return releaseJob;

    }

    private async createRelease(project: TeamProject, definition: ReleaseDefinition, parameters: IParameters, details: IDetails): Promise<Release> {

        const debug = this.debugLogger.extend(this.createRelease.name);

        let release: Release;

        switch (parameters.releaseType) {

            case ReleaseType.Create: {

                throw new Error(`Not implemented`);

                break;

            } case ReleaseType.Latest: {

                const releaseFilters: IReleaseFilter = await this.getReleaseFilters(project, definition, parameters.releaseTag, parameters.artifactTag, parameters.sourceBranch);

                release = await this.releaseHelper.findRelease(project.name!, definition.id!, parameters.stages, releaseFilters);

                break;

            } case ReleaseType.Specific: {

                release = await this.releaseHelper.getRelease(project.name!, Number(parameters.releaseId), parameters.stages);

                break;

            } default: {

                throw new Error(`Release type <${parameters.releaseType}> not supported`);

            }

        }

        return release;

    }

}
