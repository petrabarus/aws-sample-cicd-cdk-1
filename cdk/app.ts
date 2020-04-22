#!/usr/bin/env node
/*********************************
 * AWS CDK script to provision the resources.
 */

import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CiCdPipeline } from './pipeline';
import { AppCluster } from './cluster';
import { CodeRepository } from './coderepo';

class MyWebStack extends cdk.Stack {
    private codeRepo: CodeRepository;
    private stagingCluster: AppCluster;
    private productionCluster: AppCluster;

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.createCodeCommitRepo();
        this.createStagingApp();
        this.createProductionApp();
        this.createPipeline();
    }

    createCodeCommitRepo() {
        this.codeRepo = new CodeRepository(this, 'CodeRepository');
    }

    createStagingApp() {
        this.stagingCluster = new AppCluster(this, 'StagingCluster', {
            appEnv: 'staging',
            desiredCount: 1,
        });
    }

    createProductionApp() {
        this.productionCluster = new AppCluster(this, 'ProductionCluster', {
            appEnv: 'production',
            desiredCount: 3,
        });
    }

    createPipeline() {
        var email = process.env.NOTIFY_EMAILS  || "email@example.com";
        new CiCdPipeline(this, 'CiCdPipeline', {
            repository: this.codeRepo.repo,
            notifyEmails: [email],
            stagingCluster: this.stagingCluster,
            productionCluster: this.productionCluster,
        });
    }
}

const app = new cdk.App();
new MyWebStack(app, 'MyWebStack');
app.synth();
