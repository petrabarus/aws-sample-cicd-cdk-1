import * as cdk from '@aws-cdk/core';
import * as ecs from "@aws-cdk/aws-ecs";
import * as elbv2 from "@aws-cdk/aws-elasticloadbalancingv2" 
import * as ecsPatterns from "@aws-cdk/aws-ecs-patterns";

export interface AppClusterProps {
    appEnv: string,
    desiredCount: number,
}

export class AppCluster extends cdk.Construct {
    private props: AppClusterProps;
    public fargateService: ecsPatterns.ApplicationLoadBalancedFargateService;
    public serviceUrl: string;

    constructor(scope: cdk.Construct, id: string, props: AppClusterProps) {
        super(scope, id);
        this.props = props;
        const cluster = this.createCluster();
        this.createService(cluster);
    }

    private createCluster(): ecs.Cluster {
        const cluster = new ecs.Cluster(this, 'Cluster');
        return cluster;
    }

    private createService(cluster: ecs.Cluster) {
        this.fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Service1', {
            cluster: cluster,
            taskImageOptions: {
                image: ecs.ContainerImage.fromRegistry('nginx'),
                environment: {
                    APP_ENV: this.props.appEnv,
                }
            },
            desiredCount: 2,
        });
        this.fargateService.targetGroup.configureHealthCheck(shortHealthCheck);

        const protocol = elbv2.ApplicationProtocol.HTTP;
        this.serviceUrl = protocol.toLowerCase() + '://' + this.fargateService.loadBalancer.loadBalancerDnsName; 
        new cdk.CfnOutput(this, 'ELBURL', { value: this.serviceUrl });
    }
}

const shortHealthCheck: elbv2.HealthCheck = {
    "interval": cdk.Duration.seconds(5),
    "timeout": cdk.Duration.seconds(4),
    "healthyThresholdCount": 2,
    "unhealthyThresholdCount": 2,
    "healthyHttpCodes": "200,301,302"
}
