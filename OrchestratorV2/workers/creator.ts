import Debug from "debug";

import { TeamProject } from "azure-devops-node-api/interfaces/CoreInterfaces";
import { Build } from "azure-devops-node-api/interfaces/BuildInterfaces";
import { ReleaseDefinition, Release, Artifact } from "azure-devops-node-api/interfaces/ReleaseInterfaces";

import { IParameters, ReleaseType } from "../interfaces/task/parameters";
import { IDetails } from "../interfaces/task/details";
import { IDebugLogger } from "../interfaces/common/debuglogger";
import { IConsoleLogger } from "../interfaces/common/consolelogger";
import { ICommonHelper } from "../interfaces/helpers/commonhelper";
import { ICoreHelper } from "../interfaces/helpers/corehelper";
import { IReleaseHelper } from "../interfaces/helpers/releasehelper";
import { ICreator } from "../interfaces/workers/creator";
import { IBuildHelper } from "../interfaces/helpers/buildhelper";
import { IReleaseJob } from "../interfaces/orchestrator/releasejob";
import { IReleaseFilter } from "../interfaces/orchestrator/releasefilter";
import { IArtifactFilter } from "../interfaces/orchestrator/artifactfilter";
import { ISettings } from "../interfaces/orchestrator/settings";
import { DeploymentType } from "../interfaces/orchestrator/deploymenttype";

export class Creator implements ICreator {

    private debugLogger: Debug.Debugger;
    private consoleLogger: IConsoleLogger;

    private commonHelper: ICommonHelper;
    private coreHelper: ICoreHelper;
    private buildHelper: IBuildHelper;
    private releaseHelper: IReleaseHelper;

    constructor(commonHelper: ICommonHelper, coreHelper: ICoreHelper, buildHelper: IBuildHelper, releaseHelper: IReleaseHelper, debugLogger: IDebugLogger, consoleLogger: IConsoleLogger) {

        this.debugLogger = debugLogger.create(this.constructor.name);
        this.consoleLogger = consoleLogger;

        this.commonHelper = commonHelper;
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
        const targetStages: string[] = await this.releaseHelper.getReleaseStages(targetRelease, parameters.stages);

        const releaseType: DeploymentType = await this.releaseHelper.getReleaseType(targetRelease);

        const settings: ISettings = {

            sleep: 5000,
            approvalRetry: 60,
            approvalSleep: 60000

        }

        const releaseJob: IReleaseJob = {

            project: targetProject,
            definition: targetDefinition,
            release: targetRelease,
            stages: targetStages,
            type: releaseType,
            settings: settings,

        };

        return releaseJob;

    }

    private async createRelease(project: TeamProject, definition: ReleaseDefinition, parameters: IParameters, details: IDetails): Promise<Release> {

        const debug = this.debugLogger.extend(this.createRelease.name);

        let release: Release;

        switch (parameters.releaseType) {

            case ReleaseType.Create: {

                const artifactFilter: IArtifactFilter[] = await this.createArtifactFilter(project, definition, parameters.artifactTag, parameters.sourceBranch);

                release = await this.releaseHelper.createRelease(project.name!, definition, details, parameters.stages, artifactFilter);

                break;

            } case ReleaseType.Latest: {

                const releaseFilter: IReleaseFilter = await this.createReleaseFilter(project, definition, parameters.releaseTag, parameters.artifactTag, parameters.sourceBranch);

                release = await this.releaseHelper.findRelease(project.name!, definition.id!, parameters.stages, releaseFilter);

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

    private async createReleaseFilter(project: TeamProject, definition: ReleaseDefinition, releaseTag?: string[], artifactTag?: string[], sourceBranch?: string): Promise<IReleaseFilter> {

        const debug = this.debugLogger.extend(this.createReleaseFilter.name);

        const releaseFilter: IReleaseFilter = {};

        // Get primary definition build artifact
        const primaryBuildArtifact: Artifact = definition.artifacts!.filter((i) => i.isPrimary === true && i.type === "Build")[0];

        // Add release tag filter
        if (releaseTag && releaseTag.length >= 1) {

            this.consoleLogger.log(`Using <${releaseTag}> tag(s) for target release filter`);

            releaseFilter.tag = releaseTag;

        }

        if (primaryBuildArtifact) {

            // Add artifact tag filter
            if (artifactTag && artifactTag.length >= 1) {

                this.consoleLogger.log(`Using <${artifactTag}> artifact tag(s) for target release filter`);

                // Get build matching artifact tag
                const targetArtifactBuild: Build = await this.buildHelper.findBuild(project.name!, Number(primaryBuildArtifact.definitionReference!.definition.id), artifactTag);

                releaseFilter.artifactVersion = String(targetArtifactBuild.id);

            }

            // Add source branch filter
            if (sourceBranch) {

                console.log(`Using <${sourceBranch}> artifact branch for target release filter`);

                releaseFilter.sourceBranch = sourceBranch;

            }

        }

        debug(releaseFilter);

        return releaseFilter;

    }

    private async createArtifactFilter(project: TeamProject, definition: ReleaseDefinition, artifactTag?: string[], sourceBranch?: string): Promise<IArtifactFilter[]> {

        const debug = this.debugLogger.extend(this.createArtifactFilter.name);

        let artifactFilter: IArtifactFilter[] = [];

        // Get primary definition build artifact
        const primaryBuildArtifact: Artifact = definition.artifacts!.filter((i) => i.isPrimary === true && i.type === "Build")[0];

        if (primaryBuildArtifact) {

            let artifactVersion;

            // Get build matching artifact tag
            if (artifactTag && artifactTag.length >= 1) {

                console.log(`Using <${artifactTag}> artifact tag(s) for target release filter`);

                const targetArtifactBuild: Build = await this.buildHelper.findBuild(project.name!, Number(primaryBuildArtifact.definitionReference!.definition.id), artifactTag);

                artifactVersion = String(targetArtifactBuild.id);

            }

            // Confirm source branch filter
            if (sourceBranch) {

                console.log(`Using <${sourceBranch}> artifact branch for target release filter`);

            }

            artifactFilter = await this.releaseHelper.getArtifacts(project.name!, definition.id!, primaryBuildArtifact.sourceId!, artifactVersion, sourceBranch);

        }

        debug(artifactFilter);

        return artifactFilter;

    }

}
