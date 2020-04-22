import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipelineActions from '@aws-cdk/aws-codepipeline-actions';
import * as ssm from '@aws-cdk/aws-ssm';
import * as codecommit from '@aws-cdk/aws-codecommit';
import * as ecr from '@aws-cdk/aws-ecr';
import { AppCluster } from './cluster';

export interface CiCdPipelineProps {
    repository: codecommit.IRepository;
    notifyEmails: Array<string>;
    stagingCluster: AppCluster;
    productionCluster: AppCluster;
}

export class CiCdPipeline extends cdk.Construct {
    private props: CiCdPipelineProps;
    private pipeline: codepipeline.Pipeline;
    private ecrRepo: ecr.Repository;

    constructor(scope: cdk.Construct, id: string, props: CiCdPipelineProps) {
        super(scope, id);
        this.props = props;
        this.createECRRepository();
        this.createPipeline();
    }

    createECRRepository() {
        this.ecrRepo = new ecr.Repository(this, 'ECRRepository');
    }

    createPipeline() {
        const sourceOutput = new codepipeline.Artifact();
        const buildOutput = new codepipeline.Artifact();
        const stages = [
            this.createStageSource(sourceOutput),
            this.createUnitTestStage(sourceOutput),
            this.createBuildStage(sourceOutput, buildOutput),
            this.createDeployToStagingStage(buildOutput),
            this.createManualApprovalStage(),
            this.createDeployToProductionStage(buildOutput),
        ];
        this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
            stages: stages,
        });
    }

    createStageSource(output: codepipeline.Artifact): codepipeline.StageOptions {
        const action = new codepipelineActions.CodeCommitSourceAction({
            actionName: 'CodeCommit',
            repository: this.props.repository,
            output: output,
        });

        return {
            stageName: 'Source',
            actions: [action]
        };
    }

    createUnitTestStage(input: codepipeline.Artifact): codepipeline.StageOptions {
        const props: codebuild.PipelineProjectProps = {
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
            },
            buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.test.yml'),
        };
        const project = new codebuild.PipelineProject(this, 'TestProject', props);
        const action = new codepipelineActions.CodeBuildAction({
            actionName: 'UnitTestBuildAction',
            input: input,
            project: project,
        });
        return {
            stageName: 'UnitTest',
            actions: [action],
        };
    }
    
    createBuildStage(input: codepipeline.Artifact, output: codepipeline.Artifact): codepipeline.StageOptions {
        const props: codebuild.PipelineProjectProps = {
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
                privileged: true,
            },
            buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.deploy.yml'),
            environmentVariables: {
                REPOSITORY_URI: {value: this.ecrRepo.repositoryUri},
                CONTAINER_NAME: {value: "web"},
            }
        };
        const project = new codebuild.PipelineProject(this, 'ImageBuildProject', props);
        this.ecrRepo.grantPullPush(project.grantPrincipal);

        const action = new codepipelineActions.CodeBuildAction({
            actionName: 'ImageBuildAction',
            input: input,
            outputs: [output],
            project: project,
        });
        return {
            stageName: 'Build',
            actions: [action],
        };
    }

    createDeployToStagingStage(input: codepipeline.Artifact): codepipeline.StageOptions {
        const fargateService = this.props.stagingCluster.fargateService;
        this.ecrRepo.grantPull(fargateService.taskDefinition.executionRole!);

        const ecsDeployAction = new codepipelineActions.EcsDeployAction({
            actionName: 'StagingEcsDeployAction',
            input: input,
            service: fargateService.service,
        });

        
        return {
            stageName: 'DeployToStaging',
            actions: [ecsDeployAction],
        };
    }

    createManualApprovalStage(): codepipeline.StageProps {
        const manualApprovalAction = new codepipelineActions.ManualApprovalAction({
            actionName: 'ManualApprovalAction',
            notifyEmails: this.props.notifyEmails,
            externalEntityLink: this.props.stagingCluster.serviceUrl
        });
        return {
            stageName: 'ManualApproval',
            actions: [manualApprovalAction],
        };
    }

    createDeployToProductionStage(input: codepipeline.Artifact): codepipeline.StageOptions {
        const fargateService = this.props.productionCluster.fargateService;
        this.ecrRepo.grantPull(fargateService.taskDefinition.executionRole!);

        const ecsDeployAction = new codepipelineActions.EcsDeployAction({
            actionName: 'ProductionEcsDeployAction',
            input: input,
            service: fargateService.service,
        });
        return {
            stageName: 'DeployToProduction',
            actions: [ecsDeployAction],
        };
    }
}
