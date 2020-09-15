import "mocha";

import * as chai from "chai";
import * as TypeMoq from "typemoq";
import { ImportMock } from "ts-mock-imports";

import * as TaskLibrary from "azure-pipelines-task-lib/task";

import { IDebugCreator } from "../../interfaces/loggers/debugcreator";
import { IDebugLogger } from "../../interfaces/loggers/debuglogger";
import { TaskHelper } from "../../helpers/taskhelper";
import { ITaskHelper } from "../../interfaces/helpers/taskhelper";

describe("TaskHelper", ()  => {

    const debugLoggerMock = TypeMoq.Mock.ofType<IDebugLogger>();
    const debugCreatorMock = TypeMoq.Mock.ofType<IDebugCreator>();
    debugCreatorMock.setup((x) => x.extend(TypeMoq.It.isAnyString())).returns(() => debugLoggerMock.target);
    debugLoggerMock.setup((x) => x.extend(TypeMoq.It.isAnyString())).returns(() => debugLoggerMock.target);

    const endpointNameMock: string = "My-Endpoint";

    const orchestratorProjectNameMock: string = "My-Orchestrator-Project";
    const orchestratorReleaseNameMock: string = "My-Orchestrator-Release";
    const orchestratorRequesterNameMock: string = "My-Requester-Name";
    const orchestratorRequesterIdMock: string = "My-Requester-Id";

    const projectNameMock: string = "My-Project";
    const definitionNameMock: string = "My-Definition";
    const releaseNameMock: string = "My-Release";
    const releaseStagesMock: string = "DEV,TEST,PROD";

    const releaseTagNameMock: string = "My-Tag-One,My-Tag-Two";
    const artifactTagNameMock: string = "My-Artifact-Tag-One,My-Artifact-Tag-Two";
    const sourceBranchNameMock: string = "My-Branch";
    const stageStatusMock: string = "succeeded,rejected";

    const updateIntervalMock: string = "1";
    const approvalRetryMock: string = "1";

    let inputs: {[key: string]: string | boolean};
    let variables: {[key: string]: string};

    const taskHelper: ITaskHelper = new TaskHelper(debugCreatorMock.target);

    beforeEach(async () => {

        const getInputMock = ImportMock.mockFunction(TaskLibrary, "getInput");
        getInputMock.callsFake(i => { return inputs[i] || null; });

        const getBoolInputMock = ImportMock.mockFunction(TaskLibrary, "getBoolInput");
        getBoolInputMock.callsFake(i => { return (typeof inputs[i] === "boolean") ? inputs[i] : false; });

        const getDelimitedInputMock = ImportMock.mockFunction(TaskLibrary, "getDelimitedInput");
        getDelimitedInputMock.callsFake(i => { return inputs[i] ? inputs[i].toString().split(",") : []; });

        const getVariableMock = ImportMock.mockFunction(TaskLibrary, "getVariable");
        getVariableMock.callsFake(i => { return variables[i] || null; });

        inputs = {};
        variables = {};

    });

    afterEach(async () => {

        ImportMock.restore();

    });

    it("Should get latest release parameters", async () => {

        //#region ARRANGE

        inputs["releaseStrategy"] = "latest";
        inputs["projectName"] = projectNameMock;
        inputs["definitionName"] = definitionNameMock;

        inputs["releaseTagFilter"] = true;
        inputs["releaseTagName"] = releaseTagNameMock;

        inputs["artifactTagFilter"] = true;
        inputs["artifactTagName"] = artifactTagNameMock;

        inputs["sourceBranchFilter"] = true;
        inputs["sourceBranchName"] = sourceBranchNameMock;

        inputs["stageStatusFilter"] = true;
        inputs["stageStatus"] = stageStatusMock;

        inputs["updateInterval"] = updateIntervalMock;
        inputs["approvalRetry"] = approvalRetryMock;

        inputs["releaseStages"] = releaseStagesMock;

        //#endregion

        //#region ACT

        const result = await taskHelper.getParameters();

        //#endregion

        //#region ASSERT

        chai.expect(result).to.not.eq(null);
        chai.expect(result.releaseType).to.eq("Latest");
        chai.expect(result.projectName).to.eq(projectNameMock);
        chai.expect(result.definitionName).to.eq(definitionNameMock);

        chai.expect(result.settings.sleep).to.eq(Number(updateIntervalMock) * 1000);
        chai.expect(result.settings.approvalRetry).to.eq(Number(approvalRetryMock));

        chai.expect(result.stages).to.eql([ "DEV", "TEST", "PROD" ]);
        chai.expect(result.filters.releaseTags).to.eql([ "My-Tag-One", "My-Tag-Two" ]);
        chai.expect(result.filters.artifactTags).to.eql([ "My-Artifact-Tag-One", "My-Artifact-Tag-Two" ]);
        chai.expect(result.filters.artifactBranch).to.eq(sourceBranchNameMock);
        chai.expect(result.filters.stageStatuses).to.eql([ "succeeded", "rejected" ]);

        //#endregion

    });

    it("Should get specific release parameters", async () => {

        //#region ARRANGE

        inputs["releaseStrategy"] = "specific";
        inputs["projectName"] = projectNameMock;
        inputs["definitionName"] = definitionNameMock;

        inputs["updateInterval"] = updateIntervalMock;
        inputs["approvalRetry"] = approvalRetryMock;

        inputs["releaseName"] = releaseNameMock;
        inputs["releaseStages"] = releaseStagesMock;

        //#endregion

        //#region ACT

        const result = await taskHelper.getParameters();

        //#endregion

        //#region ASSERT

        chai.expect(result).to.not.eq(null);
        chai.expect(result.releaseType).to.eq("Specific");
        chai.expect(result.projectName).to.eq(projectNameMock);
        chai.expect(result.definitionName).to.eq(definitionNameMock);

        chai.expect(result.settings.sleep).to.eq(Number(updateIntervalMock) * 1000);
        chai.expect(result.settings.approvalRetry).to.eq(Number(approvalRetryMock));

        chai.expect(result.releaseName).to.eq(releaseNameMock);
        chai.expect(result.stages).to.eql([ "DEV", "TEST", "PROD" ]);

        //#endregion

    });

    it("Should get orchestrator details", async () => {

        //#region ARRANGE

        inputs["endpointName"] = endpointNameMock;

        variables["SYSTEM_TEAMPROJECT"] = orchestratorProjectNameMock;
        variables["RELEASE_RELEASENAME"] = orchestratorReleaseNameMock;
        variables["RELEASE_DEPLOYMENT_REQUESTEDFOR"] = orchestratorRequesterNameMock;
        variables["RELEASE_DEPLOYMENT_REQUESTEDFORID"] = orchestratorRequesterIdMock;

        //#endregion

        //#region ACT

        const result = await taskHelper.getDetails();

        //#endregion

        //#region ASSERT

        chai.expect(result).to.not.eq(null);
        chai.expect(result.endpointName).to.eq(endpointNameMock);
        chai.expect(result.projectName).to.eq(orchestratorProjectNameMock);
        chai.expect(result.releaseName).to.eq(orchestratorReleaseNameMock);
        chai.expect(result.requesterName).to.eq(orchestratorRequesterNameMock);
        chai.expect(result.requesterId).to.eq(orchestratorRequesterIdMock);

        //#endregion

    });

});
