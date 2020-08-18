import { IReleaseProgress } from "../common/releaseprogress";
import { IStageProgress } from "../common/stageprogress";

export interface IReporter {

    getReleaseProgress(releaseProgress: IReleaseProgress): string;
    getStagesProgress(stagesProgress: IStageProgress[]): string;
    getStageProgress(stageProgress: IStageProgress): string;

}
