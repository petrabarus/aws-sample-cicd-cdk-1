import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as codecommit from '@aws-cdk/aws-codecommit';

export class CodeRepository extends cdk.Construct {
    public repo: codecommit.Repository;
    public group: iam.Group;
    
    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        this.createCodeCommitRepo();
        this.createGroup();
        this.output();
    }

    createCodeCommitRepo() {
        this.repo = new codecommit.Repository(this, 'CodeRepository', {
            repositoryName: 'MyAppRepository',
        });
    }

    createGroup() {
        //this.group = iam.Group.fromGroupArn('');
        this.group = new iam.Group(this, 'Developers');
        this.repo.grantPullPush(this.group);
    }

    output() {
        const concat = new cdk.StringConcat();
        new cdk.CfnOutput(this, 'GitRepo', { value: concat.join('codecommit://', this.repo.repositoryName) });
        new cdk.CfnOutput(this, 'Group', { value: this.group.groupName });
    }
}
